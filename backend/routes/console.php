<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Artisan::command('nutrition:import {dir?} {--truncate} {--skip-compo}', function () {
    // Import can be large (compo ~ millions of rows)
    @ini_set('memory_limit', '512M');
    DB::disableQueryLog();

    $dir = $this->argument('dir')
        ? (string) $this->argument('dir')
        : base_path('../datas/nutritions');

    $dir = rtrim($dir, "\\/ ");

    if (! is_dir($dir)) {
        $this->error("Nutrition import: directory not found: {$dir}");
        return 1;
    }

    $findFile = function (string $pattern) use ($dir): ?string {
        $matches = File::glob($dir.DIRECTORY_SEPARATOR.$pattern);
        if (! $matches || count($matches) === 0) {
            return null;
        }
        return $matches[0];
    };

    $files = [
        'alim' => $findFile('alim_*.xml'),
        'alim_grp' => $findFile('alim_grp_*.xml'),
        'const' => $findFile('const_*.xml'),
        'sources' => $findFile('sources_*.xml'),
        'compo' => $findFile('compo_*.xml'),
    ];

    foreach (['alim', 'alim_grp', 'const', 'sources'] as $required) {
        if (! $files[$required]) {
            $this->error("Nutrition import: missing {$required} XML in {$dir}");
            return 1;
        }
    }

    if (! $files['compo'] && ! $this->option('skip-compo')) {
        $this->error("Nutrition import: missing compo XML in {$dir} (or pass --skip-compo)");
        return 1;
    }

    $toInt = function (?string $v): ?int {
        if ($v === null) {
            return null;
        }
        $t = trim($v);
        return $t === '' ? null : (int) $t;
    };

    $toStr = function (?string $v): ?string {
        if ($v === null) {
            return null;
        }
        $t = trim($v);
        return $t === '' ? null : $t;
    };

    $toDecimal = function (?string $v): ?string {
        if ($v === null) {
            return null;
        }

        $t = trim($v);
        if ($t === '') {
            return null;
        }

        $t = str_replace(["\u{00A0}", ' '], '', $t);
        $t = str_replace(',', '.', $t);
        $lower = strtolower($t);

        // Common placeholders in CIQUAL-like datasets
        if ($lower === '-' || $lower === '?' || $lower === 'traces' || $lower === 'nd' || $lower === 'na') {
            return null;
        }

        // Values like "<0.5" or ">1" -> keep numeric part
        $t = ltrim($t, "<>~=");

        // Keep only leading numeric (supports 12, 12.3, .5)
        if (preg_match('/^-?(?:\d+(?:\.\d+)?|\.\d+)$/', $t) !== 1) {
            return null;
        }

        return $t;
    };

    $parseTable = function (string $filePath, string $rowTag, callable $mapRow, string $table, array $uniqueBy = []) {
        $reader = new XMLReader();
        if (! $reader->open($filePath)) {
            throw new RuntimeException("Unable to open XML file: {$filePath}");
        }

        $batch = [];
        $batchSize = 2000;
        $count = 0;
        $now = now()->toDateTimeString();

        while ($reader->read()) {
            if ($reader->nodeType !== XMLReader::ELEMENT || $reader->name !== $rowTag) {
                continue;
            }

            $xml = $reader->readOuterXML();
            if (! $xml) {
                continue;
            }

            $node = new SimpleXMLElement($xml);
            $row = $mapRow($node, $now);
            if (! $row) {
                continue;
            }

            $batch[] = $row;
            $count++;

            if (count($batch) >= $batchSize) {
                if (count($uniqueBy) > 0) {
                    DB::table($table)->upsert($batch, $uniqueBy);
                } else {
                    DB::table($table)->insert($batch);
                }
                $batch = [];

                if ($count % 50000 === 0) {
                    $this->line("Imported {$count} rows into {$table}...");
                }
            }
        }

        if (count($batch) > 0) {
            if (count($uniqueBy) > 0) {
                DB::table($table)->upsert($batch, $uniqueBy);
            } else {
                DB::table($table)->insert($batch);
            }
        }

        $reader->close();
        return $count;
    };

    $readFlatNode = function (XMLReader $reader): array {
        // Assumes the cursor is on a start element (e.g., <COMPO>)
        $root = $reader->name;
        $values = [];

        while ($reader->read()) {
            if ($reader->nodeType === XMLReader::END_ELEMENT && $reader->name === $root) {
                break;
            }

            if ($reader->nodeType !== XMLReader::ELEMENT) {
                continue;
            }

            $field = $reader->name;

            // Move to text node (or end element for empty tags)
            $reader->read();
            $values[$field] = $reader->value;
        }

        return $values;
    };

    $truncate = (bool) $this->option('truncate');
    $skipCompo = (bool) $this->option('skip-compo');

    if ($truncate) {
        $this->warn('Truncating nutrition tables...');
        DB::table('nutrition_compositions')->truncate();
        DB::table('nutrition_sources')->truncate();
        DB::table('nutrition_constituents')->truncate();
        DB::table('nutrition_groups')->truncate();
        DB::table('nutrition_foods')->truncate();
    }

    $this->info('Importing nutrition groups (alim_grp)...');
    $groupsCount = $parseTable(
        $files['alim_grp'],
        'ALIM_GRP',
        function (SimpleXMLElement $n, $now) use ($toStr) {
            return [
                'alim_grp_code' => $toStr((string) $n->alim_grp_code),
                'alim_grp_name_fr' => $toStr((string) $n->alim_grp_nom_fr),
                'alim_grp_name_en' => $toStr((string) $n->alim_grp_nom_eng),
                'alim_ssgrp_code' => $toStr((string) $n->alim_ssgrp_code),
                'alim_ssgrp_name_fr' => $toStr((string) $n->alim_ssgrp_nom_fr),
                'alim_ssgrp_name_en' => $toStr((string) $n->alim_ssgrp_nom_eng),
                'alim_ssssgrp_code' => $toStr((string) $n->alim_ssssgrp_code),
                'alim_ssssgrp_name_fr' => $toStr((string) $n->alim_ssssgrp_nom_fr),
                'alim_ssssgrp_name_en' => $toStr((string) $n->alim_ssssgrp_nom_eng),
                'created_at' => $now,
                'updated_at' => $now,
            ];
        },
        'nutrition_groups',
        ['alim_grp_code', 'alim_ssgrp_code', 'alim_ssssgrp_code'],
    );
    $this->info("Imported {$groupsCount} nutrition groups.");

    $this->info('Importing nutrition constituents (const)...');
    $constCount = $parseTable(
        $files['const'],
        'CONST',
        function (SimpleXMLElement $n, $now) use ($toInt, $toStr) {
            $code = $toInt((string) $n->const_code);
            if ($code === null) {
                return null;
            }
            return [
                'const_code' => $code,
                'name_fr' => $toStr((string) $n->const_nom_fr) ?? '',
                'name_en' => $toStr((string) $n->const_nom_eng),
                'infoods_code' => $toStr((string) $n->code_INFOODS),
                'created_at' => $now,
                'updated_at' => $now,
            ];
        },
        'nutrition_constituents',
        ['const_code'],
    );
    $this->info("Imported {$constCount} nutrition constituents.");

    $this->info('Importing nutrition sources (sources)...');
    $sourcesCount = $parseTable(
        $files['sources'],
        'SOURCES',
        function (SimpleXMLElement $n, $now) use ($toInt, $toStr) {
            $code = $toInt((string) $n->source_code);
            if ($code === null) {
                return null;
            }
            return [
                'source_code' => $code,
                'ref_citation' => $toStr((string) $n->ref_citation),
                'created_at' => $now,
                'updated_at' => $now,
            ];
        },
        'nutrition_sources',
        ['source_code'],
    );
    $this->info("Imported {$sourcesCount} nutrition sources.");

    $this->info('Importing nutrition foods (alim)...');
    $foodsCount = $parseTable(
        $files['alim'],
        'ALIM',
        function (SimpleXMLElement $n, $now) use ($toInt, $toStr, $toDecimal) {
            $code = $toInt((string) $n->alim_code);
            if ($code === null) {
                return null;
            }
            return [
                'alim_code' => $code,
                'name_fr' => $toStr((string) $n->alim_nom_fr) ?? '',
                'name_en' => $toStr((string) $n->alim_nom_eng),
                'name_sci' => $toStr((string) $n->alim_nom_sci),
                'alim_grp_code' => $toStr((string) $n->alim_grp_code),
                'alim_ssgrp_code' => $toStr((string) $n->alim_ssgrp_code),
                'alim_ssssgrp_code' => $toStr((string) $n->alim_ssssgrp_code),
                'facteur_jones' => $toDecimal((string) $n->facteur_Jones),
                'created_at' => $now,
                'updated_at' => $now,
            ];
        },
        'nutrition_foods',
        ['alim_code'],
    );
    $this->info("Imported {$foodsCount} nutrition foods.");

    if (! $skipCompo) {
        $this->info('Importing nutrition compositions (compo) - this can take a while...');
        $useUpsert = ! $truncate;

        $reader = new XMLReader();
        if (! $reader->open($files['compo'])) {
            $this->error("Unable to open compo XML: {$files['compo']}");
            return 1;
        }

        $batch = [];
        $batchSize = 500;
        $count = 0;
        $now = now()->toDateTimeString();

        while ($reader->read()) {
            if ($reader->nodeType !== XMLReader::ELEMENT || $reader->name !== 'COMPO') {
                continue;
            }

            $values = $readFlatNode($reader);
            $alim = $toInt($values['alim_code'] ?? null);
            $const = $toInt($values['const_code'] ?? null);
            if ($alim === null || $const === null) {
                continue;
            }

            $batch[] = [
                'alim_code' => $alim,
                'const_code' => $const,
                'teneur' => $toDecimal($values['teneur'] ?? null),
                'min' => $toDecimal($values['min'] ?? null),
                'max' => $toDecimal($values['max'] ?? null),
                'code_confiance' => $toStr($values['code_confiance'] ?? null),
                'source_code' => $toInt($values['source_code'] ?? null),
                'created_at' => $now,
                'updated_at' => $now,
            ];

            $count++;

            if (count($batch) >= $batchSize) {
                if ($useUpsert) {
                    DB::table('nutrition_compositions')->upsert(
                        $batch,
                        ['alim_code', 'const_code'],
                        ['teneur', 'min', 'max', 'code_confiance', 'source_code', 'updated_at'],
                    );
                } else {
                    DB::table('nutrition_compositions')->insert($batch);
                }

                $batch = [];

                if ($count % 20000 === 0) {
                    gc_collect_cycles();
                }

                if ($count % 50000 === 0) {
                    $this->line("Imported {$count} rows into nutrition_compositions...");
                }
            }
        }

        if (count($batch) > 0) {
            if ($useUpsert) {
                DB::table('nutrition_compositions')->upsert(
                    $batch,
                    ['alim_code', 'const_code'],
                    ['teneur', 'min', 'max', 'code_confiance', 'source_code', 'updated_at'],
                );
            } else {
                DB::table('nutrition_compositions')->insert($batch);
            }
        }

        $reader->close();
        $this->info("Imported {$count} nutrition compositions.");
    }

    $this->info('Nutrition import complete.');
    $this->line('Tip: run with --truncate for fastest import on a fresh DB.');

    return 0;
})->purpose('Import nutrition XML dataset into SQL tables');
