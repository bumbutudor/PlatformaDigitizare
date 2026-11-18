<?php

/*
 * This file is part of block-cat/digi-media-manager.
 *
 * Copyright (c) 2021 .
 *
 * For the full copyright and license information, please view the LICENSE.md
 * file that was distributed with this source code.
 */

namespace BlockCat\DigiMediaManager;

use Flarum\Extend;
use Flarum\Discussion\DiscussionValidator;
use Flarum\Post\PostValidator;
use Illuminate\Support\Str;
use s9e\TextFormatter\Configurator;

use FoF\Upload\Events\File\WasSaved;
use BlockCat\DigiMediaManager\Listeners\CopyUploadedFile;

return [
    // This callback checks a service secret; browser routes retain CSRF checks.
    (new Extend\Csrf())->exemptRoute('block-cat-dmm.results'),
    (new Extend\Routes('api'))
        ->post('/digitization/jobs', 'block-cat-dmm.jobs.create', Digitization\BridgeController::class)
        ->get('/digitization/jobs/{id}', 'block-cat-dmm.jobs.status', Digitization\BridgeController::class)
        ->post('/digitization/jobs/{id}', 'block-cat-dmm.jobs.retry', Digitization\BridgeController::class)
        ->post('/digitization/jobs/{id}/draft', 'block-cat-dmm.jobs.draft', Digitization\BridgeController::class)
        ->post('/digitization/results', 'block-cat-dmm.results', Digitization\BridgeController::class),
    (new Extend\Frontend('forum'))
        ->route('/digitizare', 'block-cat-dmm.advanced')
        ->route('/digitizare/rezultat/{id}', 'block-cat-dmm.result')
        ->js(__DIR__.'/js/dist/forum.js')
        ->css(__DIR__.'/resources/less/forum.less'),
    // (new Extend\Frontend('admin'))
    //     ->js(__DIR__.'/js/dist/admin.js')
    //     ->css(__DIR__.'/resources/less/admin.less'),
    new Extend\Locales(__DIR__ . '/resources/locale'),
    (new Extend\Formatter)
        ->configure(function(Configurator $config) {
            $config->BBCodes->addCustom(
                '[chirilic]{TEXT}[/chirilic]',
                '<span class="chirilic">{TEXT}</span>'
            );
            $config->BBCodes->addCustom(
                '[transliterat]{TEXT}[/transliterat]',
                '<span class="transliterat">{TEXT}</span>'
            );
        }),
    (new Extend\Validator(DiscussionValidator::class))
        ->configure(function ($flarumValidator, $validator) {
            $rules = $validator->getRules();

            if (!array_key_exists('title', $rules)) {
                return;
            }

            $rules['title'] = array_map(function(string $rule) {
                if (Str::startsWith($rule, 'max:')) {
                    return 'max:200';
                }

                return $rule;
            }, $rules['title']);

            $validator->setRules($rules);
        }),
    (new Extend\Validator(PostValidator::class))
        ->configure(function ($flarumValidator, $validator) {
            $rules = $validator->getRules();

            if (!array_key_exists('content', $rules)) {
                return;
            }

            $rules['content'] = array_map(function(string $rule) {
                if (Str::startsWith($rule, 'max:')) {
                    return 'max:16777215';
                }

                return $rule;
            }, $rules['content']);

            $validator->setRules($rules);
        }),
];
