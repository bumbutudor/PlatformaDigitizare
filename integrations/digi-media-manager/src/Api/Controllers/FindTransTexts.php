<?php

namespace BlockCat\DigiMediaManager\Api\Controllers;

use Flarum\Api\Controller\AbstractListController;
use Psr\Http\Message\ServerRequestInterface;
use Tobscure\JsonApi\Document;
use Flarum\Foundation\Paths;

use FoF\Upload\File;
use FoF\Upload\Api\Serializers\FileSerializer;
use Flarum\Foundation\ValidationException;
use Flarum\Locale\Translator;

class FindTransTexts extends AbstractListController {
    // Need for serialize...
    // After return $result
    public $serializer = FileSerializer::class;
    protected $path;
    protected $translator;

    public function __construct(Paths $paths, Translator $translator)
    {
        $this->path = $paths->public;
        $this->translator = $translator;
    }

    protected function data(ServerRequestInterface $request, Document $document) {
        // Get sent params on request
        $params = $request->getQueryParams();

        // Extract 'user_id' from params
        $userId = array_shift($params);

        // Set all sent file ids from params in array
        $sentFileIds = [];
        foreach ($params as $param) {
            array_push($sentFileIds, $param);
        }

        // Set query depends on 'user_id' and file ids
        $query = File::where('actor_id', $userId)->whereIn('id', $sentFileIds);

        // Get all files from database
        // depends on 'user_id' and file ids
        // and order 'desc'
        $results = $query
        ->orderBy('id', 'desc')
        ->get();

        foreach ($results as $result) {
            $cyrFileName = explode(DIRECTORY_SEPARATOR, $result->path, 2)[1];
            $transFileName = "trans_" . $cyrFileName;

            if (str_ends_with($transFileName, '.jpg') || str_ends_with($transFileName, '.png')
                || str_ends_with($transFileName, '.pdf')) {
                    $pos = -4;
                };
            if (str_ends_with($transFileName, '.jpeg') || str_ends_with($transFileName, '.tiff')) {
                $pos = -5;
            };

            $cyrTextName = substr_replace($cyrFileName, ".txt", $pos);
            $transTextName = substr_replace($transFileName, ".txt", $pos);

            $cyrTextPath = $this->path .
                DIRECTORY_SEPARATOR . "assets" .
                DIRECTORY_SEPARATOR . "files" .
                DIRECTORY_SEPARATOR . "Trans" .
                DIRECTORY_SEPARATOR . $cyrTextName;

            $transTextPath = $this->path .
                DIRECTORY_SEPARATOR . "assets" .
                DIRECTORY_SEPARATOR . "files" .
                DIRECTORY_SEPARATOR . "Trans" .
                DIRECTORY_SEPARATOR . $transTextName;

            // path to python script for transliteration by Tudor on 13 october 2021
            $transScriptPath = $this->path .
                DIRECTORY_SEPARATOR . "assets" .
                DIRECTORY_SEPARATOR . "files" .
                DIRECTORY_SEPARATOR . "trans_v35.py";

            $time = 0;
            $maxTime = 25; // 25 minutes
            $timeToSleep = 5;  // 5 seconds

            // delete && !file_exists($transTextPath) check by Tudor on 13 october 2021
            while(!file_exists($cyrTextPath) && $time < $maxTime * 60 / $timeToSleep) {
                sleep($timeToSleep);
                $time++;
            }

            if ($time >= $maxTime * 60 / $timeToSleep) {
                throw new ValidationException(['file' => $this->translator->trans('digi-media-manager.forum.dropzone.errors.file_not_found')]);
            }

            // odata fisierul OCR gasit pornim procesul de transliterare
            if (file_exists($cyrTextPath)) {
                $command = escapeshellcmd('python3 ' . $transScriptPath . ' ' . $cyrTextPath);
                $output = shell_exec($command);
                sleep(2);
            }

            while(file_get_contents($cyrTextPath) === false || file_get_contents($transTextPath) === false) {
                sleep($timeToSleep);
            }

            $result->path = file_get_contents($cyrTextPath);
            $result->url = file_get_contents($transTextPath);
        }

        return $results;
    }
}
