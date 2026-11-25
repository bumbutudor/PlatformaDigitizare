<?php

/*
 * This file is part of block-cat/digi-media-manager.
 *
 * Copyright (c) 2021 .
 *
 * For the full copyright and license information, please view the LICENSE.md
 * file that was distributed with this source code.
 */

namespace BlockCat\DigiMediaManager\Listeners;

use FoF\Upload\Events\File\WasSaved;
use Flarum\Foundation\Paths;

class CopyUploadedFile {

    // /public Flarum folder
    protected $path;
    // array with files count in every OCR folder
    protected $fileCounts;

    public function __construct(Paths $paths)
    {
        // set /public Flarum folder
        $this->path = $paths->public;
        // initialization array with 10 zeros, because are 10 folder
        $this->fileCounts = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    }

    public function handle(WasSaved $event) {
        // get currently created file
        $uploadedFile = $event->file;

        // get currently created file path
        $uploadedFilePath = $uploadedFile->path;
        // get currently created file name
        $uploadedFileName = explode(DIRECTORY_SEPARATOR, $uploadedFilePath, 2)[1];

        // create absolute path to created file
        // .../flarum/public\assets\files\DATE\FILENAME
        $sourceFile = $this->path .
            DIRECTORY_SEPARATOR . "assets" .
            DIRECTORY_SEPARATOR . "files" .
            DIRECTORY_SEPARATOR . $uploadedFilePath;

        // verify every folder from /OCR folder
        // .../flarum/public\assets\files\OCR\(0-9)
        for($i=0; $i<10; $i++) {
            // create absolute path for copy destination depends on $i
            $destination = $this->path .
                DIRECTORY_SEPARATOR . "assets" .
                DIRECTORY_SEPARATOR . "files" .
                DIRECTORY_SEPARATOR . "OCR" .
                DIRECTORY_SEPARATOR . $i .
                DIRECTORY_SEPARATOR . $uploadedFileName;
            // create absolute path for folders from /OCR
            // .../flarum/public\assets\files\OCR\(0-9)\
            $ocr = $this->path .
                DIRECTORY_SEPARATOR . "assets" .
                DIRECTORY_SEPARATOR . "files" .
                DIRECTORY_SEPARATOR . "OCR" .
                DIRECTORY_SEPARATOR . $i .
                DIRECTORY_SEPARATOR;
            // get content from folders from /OCR
            $files = glob($ocr . "*");

            // verify if something exists
            if ($files) {
                // get file count from folder
                $fileCount = count($files);
                // set file count in array
                $this->fileCounts[$i] = $fileCount;
            } else {
                // copy file from $sourceFile to $destination
                copy($sourceFile, $destination);
                // finish job
                return;
            }
        }
        // if all folders are at least 1 file...

        $minFileCount = $this->fileCounts[0];
        $minFileCountIndex = 0;
        // find array index with min files count
        for($i=1; $i<10; $i++) {
            if ($this->fileCounts[$i] < $minFileCount) {
                $minFileCount = $this->fileCounts[$i];
                $minFileCountIndex = $i;
            }
        }
        // create new destination depends on $minFileCountIndex
        $destination = $this->path .
            DIRECTORY_SEPARATOR . "assets" .
            DIRECTORY_SEPARATOR . "files" .
            DIRECTORY_SEPARATOR . "OCR" .
            DIRECTORY_SEPARATOR . $minFileCountIndex .
            DIRECTORY_SEPARATOR . $uploadedFileName;

        // copy file
        copy($sourceFile, $destination);
    }
}
