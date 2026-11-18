<?php

use Illuminate\Database\Schema\Builder;
use Illuminate\Database\Schema\Blueprint;

return [
    'up' => function (Builder $schema) {
        if (!$schema->hasTable('digi_digitization_jobs')) {
            $schema->create('digi_digitization_jobs', function (Blueprint $table) {
                $table->string('id', 36)->primary();
                $table->unsignedInteger('user_id')->index();
                $table->string('mode', 16);
                $table->text('files');
                $table->string('handoff_token', 64);
                $table->unsignedInteger('draft_id')->nullable();
                $table->string('result_hash', 64)->nullable();
                $table->timestamp('created_at');
            });
        }
    },
    // Preserve job ownership and saved-document references during a rollback.
    'down' => function (Builder $schema) {},
];
