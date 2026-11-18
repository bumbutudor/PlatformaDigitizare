<?php

namespace BlockCat\DigiMediaManager\Digitization;

use Flarum\Foundation\Paths;
use Flarum\User\User;
use FoF\Upload\File;
use FoF\Drafts\Command\CreateDraft;
use Illuminate\Contracts\Bus\Dispatcher;
use Illuminate\Database\ConnectionInterface;
use Laminas\Diactoros\Response\JsonResponse;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Psr\Http\Server\RequestHandlerInterface;

class BridgeController implements RequestHandlerInterface
{
    private $paths;
    private $db;
    private $bus;

    public function __construct(Paths $paths, ConnectionInterface $db, Dispatcher $bus)
    {
        $this->paths = $paths;
        $this->db = $db;
        $this->bus = $bus;
    }

    private function config(): array
    {
        $path = $this->paths->storage . '/digitizare-bridge.json';
        $config = is_file($path) ? json_decode(file_get_contents($path), true) : [];
        if (strlen($config['key'] ?? '') < 32 || !preg_match('~^https://[^/]+/$~', $config['backend'] ?? '')) {
            throw new \RuntimeException('Legătura cu Platforma de Digitizare nu este configurată.');
        }
        return $config;
    }

    private function backend(string $path, ?array $body = null): array
    {
        $config = $this->config();
        $curl = curl_init($config['backend'] . $path);
        curl_setopt_array($curl, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_CONNECTTIMEOUT => 10,
            CURLOPT_TIMEOUT => $body === null ? 20 : 90,
            CURLOPT_HTTPHEADER => ['X-Digi-Key: ' . $config['key'], 'Accept: application/json'],
            CURLOPT_FOLLOWLOCATION => false,
            CURLOPT_PROTOCOLS => CURLPROTO_HTTPS,
        ]);
        if ($body !== null) {
            curl_setopt($curl, CURLOPT_POST, true);
            curl_setopt($curl, CURLOPT_POSTFIELDS, $body);
        }
        $raw = curl_exec($curl);
        $status = curl_getinfo($curl, CURLINFO_RESPONSE_CODE);
        curl_close($curl);
        $data = is_string($raw) ? json_decode($raw, true) : null;
        if ($status < 200 || $status >= 300 || !is_array($data)) {
            throw new \RuntimeException('Platforma de Digitizare nu răspunde momentan. Documentele sunt păstrate; reîncearcă.');
        }
        return $data;
    }

    private function ownedJob(string $id, User $actor)
    {
        $job = $this->db->table('digi_digitization_jobs')->where('id', $id)->where('user_id', $actor->id)->first();
        if (!$job) {
            throw new \InvalidArgumentException('Cererea de digitizare nu există în contul tău.');
        }
        return $job;
    }

    private function submit(array $data, User $actor): array
    {
        $id = $data['id'] ?? '';
        $mode = $data['mode'] ?? 'simple';
        $ids = array_values(array_unique($data['fileIds'] ?? []));
        if (!preg_match('/^[a-f0-9-]{36}$/D', $id) || !in_array($mode, ['simple', 'advanced'], true)
            || count($ids) > 20 || ($mode === 'simple' && !$ids)) {
            throw new \InvalidArgumentException('Selectează între 1 și 20 de documente.');
        }
        $existing = $this->db->table('digi_digitization_jobs')->where('id', $id)->first();
        if ($existing && (int) $existing->user_id !== (int) $actor->id) {
            throw new \InvalidArgumentException('Cerere invalidă.');
        }
        if ($existing) {
            $metadata = json_decode($existing->files, true);
            $mode = $existing->mode;
            $token = $existing->handoff_token;
        } else {
            $recent = $this->db->table('digi_digitization_jobs')->where('user_id', $actor->id)
                ->where('created_at', '>', date('Y-m-d H:i:s', time() - 3600))->count();
            if ($recent >= 30) {
                throw new \InvalidArgumentException('Ai trimis multe documente. Așteaptă finalizarea procesării și reîncearcă.');
            }
            $files = File::where('actor_id', $actor->id)->whereIn('id', $ids)->get()->keyBy('id');
            if ($files->count() !== count($ids)) {
                throw new \InvalidArgumentException('Poți procesa numai documentele încărcate în contul tău.');
            }
            $metadata = [];
            foreach ($ids as $fileId) {
                $file = $files->get($fileId);
                $metadata[] = ['id' => (string) $file->id, 'name' => $file->base_name ?: basename($file->path),
                    'url' => $file->url, 'path' => $file->path];
            }
            $token = bin2hex(random_bytes(32));
            $this->db->table('digi_digitization_jobs')->insert([
                'id' => $id, 'user_id' => $actor->id, 'mode' => $mode,
                'files' => json_encode($metadata), 'handoff_token' => $token, 'created_at' => date('Y-m-d H:i:s'),
            ]);
        }
        $body = ['id' => $id, 'mode' => $mode, 'handoff_token' => $token, 'files' => json_encode($metadata)];
        $root = realpath($this->paths->public . '/assets/files');
        $total = 0;
        foreach ($metadata as $i => $file) {
            $path = realpath($root . '/' . $file['path']);
            if (!$path || !is_file($path) || strpos($path, $root . DIRECTORY_SEPARATOR) !== 0
                || !preg_match('/\.(pdf|jpe?g|png|tiff?)$/i', $path)) {
                throw new \InvalidArgumentException('Documentul nu este disponibil local sau formatul nu este acceptat. Folosește PDF, JPG, PNG ori TIFF.');
            }
            $total += filesize($path);
            if ($total > 100 * 1024 * 1024) {
                throw new \InvalidArgumentException('Selectează cel mult 100 MB per cerere.');
            }
            $body['document_' . $i] = new \CURLFile($path, mime_content_type($path), basename($path));
        }
        $result = $this->backend('digi/jobs/', $body);
        $result['id'] = $id;
        if ($mode === 'advanced') {
            $result['handoff'] = ['id' => $id, 'token' => $token];
            $result['advancedUrl'] = 'https://digitizare.math.md/#digi=' . $id . '&token=' . $token;
        }
        return $result;
    }

    private function saveDraft(string $id, array $data): array
    {
        return $this->db->transaction(function () use ($id, $data) {
            $job = $this->db->table('digi_digitization_jobs')->where('id', $id)->lockForUpdate()->first();
            if (!$job) {
                throw new \InvalidArgumentException('Cererea de digitizare nu există.');
            }
            $hash = hash('sha256', json_encode($data));
            $actor = User::findOrFail($job->user_id);
            $actor->assertCan('user.saveDrafts');
            if ($job->draft_id && $job->result_hash === $hash) {
                if (!\FoF\Drafts\Draft::where('id', $job->draft_id)->where('user_id', $actor->id)->exists()) {
                    throw new \InvalidArgumentException('Ciorna a fost deja publicată sau eliminată. Verifică documentele din contul tău.');
                }
                return $this->draftResponse($job->draft_id);
            }
            $ocr = $data['ocrResults'] ?? [];
            $trans = $data['transResults'] ?? [];
            if (!is_array($ocr) || !$ocr || !is_array($trans) || count($ocr) !== count($trans)
                || strlen(json_encode($data)) > 8 * 1024 * 1024) {
                throw new \InvalidArgumentException('Rezultatele digitizării sunt incomplete.');
            }
            $sources = $data['sourceFiles'] ?? [];
            $content = '';
            foreach ($sources as $file) {
                $url = $file['url'] ?? '';
                $host = parse_url($url, PHP_URL_HOST) ?: '';
                if (parse_url($url, PHP_URL_SCHEME) !== 'https'
                    || !(in_array($host, ['digi.emoldova.org', 'win-htgf0pfg08o.tail688ab8.ts.net'], true)
                        || preg_match('/(^|\.)amazonaws\.com$/D', $host))
                    || preg_match('/[\s\[\]<>"\x00-\x1f]/', $url)) {
                    throw new \InvalidArgumentException('Adresa documentului sursă este invalidă.');
                }
                if (preg_match('/\.pdf$/i', parse_url($url, PHP_URL_PATH) ?: '')) {
                    $content .= '[url=' . $url . "]Descarcă documentul PDF[/url]\n\n";
                } else {
                    $content .= '[upl-image-preview url=' . $url . "]\n\n";
                }
            }
            foreach ($ocr as $i => $text) {
                if (!is_string($text) || !trim($text) || !is_string($trans[$i]) || !trim($trans[$i])) {
                    throw new \InvalidArgumentException('Modelul OCR sau transliterarea nu a produs text.');
                }
                $content .= "[chirilic]\n" . $text . "\n[/chirilic]\n\n[transliterat]\n" . $trans[$i] . "\n[/transliterat]\n\n";
            }
            $period = preg_replace('/[^a-zA-Z0-9]/', '', $data['period'] ?? 'secolulXX');
            if ($job->draft_id) {
                $draft = \FoF\Drafts\Draft::where('id', $job->draft_id)->where('user_id', $actor->id)->first();
                if (!$draft) {
                    throw new \InvalidArgumentException('Ciorna a fost deja publicată sau eliminată. Reconectează contul pentru a salva o ciornă nouă.');
                }
                $draft->content = $content;
                $draft->updated_at = \Carbon\Carbon::now();
                $draft->save();
            } else {
                $draft = $this->bus->dispatch(new CreateDraft($actor, [
                    'attributes' => ['title' => 'Document digitizat — ' . $period, 'content' => $content],
                    'relationships' => ['tags' => ['data' => []]],
                ], '127.0.0.1'));
            }
            $this->db->table('digi_digitization_jobs')->where('id', $id)->update(['draft_id' => $draft->id, 'result_hash' => $hash]);
            return $this->draftResponse($draft->id);
        });
    }

    private function draftResponse($id): array
    {
        return ['draftId' => (string) $id, 'url' => 'https://digi.emoldova.org/digitizare/rezultat/' . $id,
                'msg' => 'Documentul a fost salvat ca ciornă în contul tău Digi.'];
    }

    public function handle(ServerRequestInterface $request): ResponseInterface
    {
        try {
            $path = $request->getUri()->getPath();
            $data = (array) $request->getParsedBody();
            if (substr($path, -21) === '/digitization/results') {
                $key = $this->config()['key'];
                if (!hash_equals($key, $request->getHeaderLine('X-Digi-Key'))) {
                    return new JsonResponse(['msg' => 'Acces neautorizat.'], 403);
                }
                return new JsonResponse($this->saveDraft($data['id'] ?? '', $data));
            }
            $actor = $request->getAttribute('actor');
            $actor->assertRegistered();
            $actor->assertCan('user.saveDrafts');
            if (substr($path, -18) === '/digitization/jobs') {
                return new JsonResponse($this->submit($data, $actor));
            }
            $id = $request->getQueryParams()['id'] ?? '';
            $job = $this->ownedJob($id, $actor);
            if (substr($path, -6) === '/draft') {
                if ($job->draft_id) {
                    return new JsonResponse($this->draftResponse($job->draft_id));
                }
                $result = $this->backend('digi/jobs/' . $id . '/');
                if (($result['status'] ?? '') !== 'done') {
                    throw new \InvalidArgumentException('Așteaptă finalizarea OCR și a transliterării.');
                }
                $results = $result['results'];
                return new JsonResponse($this->saveDraft($id, [
                    'ocrResults' => array_column($results, 'ocr'), 'transResults' => array_column($results, 'trans'),
                    'sourceFiles' => json_decode($job->files, true), 'period' => 'secolulXX',
                ]));
            }
            $result = $this->backend('digi/jobs/' . $id . '/', $request->getMethod() === 'POST' ? [] : null);
            if ($job->draft_id) {
                $result['publication'] = $this->draftResponse($job->draft_id);
            }
            return new JsonResponse($result, 200, ['Cache-Control' => 'no-store']);
        } catch (\InvalidArgumentException $e) {
            return new JsonResponse(['msg' => $e->getMessage()], 422);
        } catch (\RuntimeException $e) {
            return new JsonResponse(['msg' => $e->getMessage()], 503);
        }
    }
}
