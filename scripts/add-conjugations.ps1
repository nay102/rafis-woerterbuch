$data = Get-Content js/words.json -Raw | ConvertFrom-Json

$irregular = @(
  'sein','haben','werden','gehen','kommen','sehen','geben','nehmen','helfen','sprechen','fahren','tragen','lesen','schreiben','essen','trinken','denken','finden','bringen','laufen','bleiben','liegen','sitzen','stehen','heißen','wissen','dürfen','können','muessen','müssen','mögen','sollen','wollen','tun','lassen','halten','schlafen','treffen','ziehen','binden','bitten','fliegen','fliehen','schneiden','singen','springen','schwimmen','verlieren','gewinnen','fallen','fressen','vergessen','beginnen','gelingen','genießen','verstehen','steigen','treten','werfen','rufen','reiten','scheinen','schieben','schießen','schließen','schweigen','schwören','sinken','stechen','stehlen','sterben','stinken','streiten','verderben','verdrießen','wachsen','waschen','weichen','weisen','wenden','werben','wiegen','zwingen'
) | ForEach-Object { $_.ToLowerInvariant() } | Select-Object -Unique

$inseparablePrefixes = @('be','emp','ent','er','ge','miss','ver','zer')
$separablePrefixes = @(
  'ab','an','auf','aus','bei','ein','mit','nach','vor','zu','zurueck','zurück','zusammen','weg','weiter','los','fest','fort',
  'heim','her','herab','heran','heraus','herbei','herein','herum','herunter','hervor','hin','hinab','hinauf','hinaus','hinein','hinweg','hinzu',
  'vorbei'
)

function Is-RegularVerb([string]$verb) {
  if (-not $verb) { return $false }
  $v = $verb.ToLowerInvariant()
  if ($v -match '\s') { return $false }
  if ($v -notmatch '^[a-zA-ZäöüßÄÖÜ]+$') { return $false }
  if ($v.EndsWith('ieren')) { return $true }
  if ($irregular -contains $v) { return $false }
  return ($v.EndsWith('en') -or $v.EndsWith('eln') -or $v.EndsWith('ern'))
}

function Get-SeparablePrefix([string]$verb) {
  $v = $verb.ToLowerInvariant()
  foreach ($p in $separablePrefixes | Sort-Object { -$_.Length }) {
    if ($v.StartsWith($p) -and $v.Length -gt ($p.Length + 2)) {
      return $p
    }
  }
  return $null
}

function Is-InseparablePrefix([string]$verb) {
  $v = $verb.ToLowerInvariant()
  foreach ($p in $inseparablePrefixes) {
    if ($v.StartsWith($p) -and $v.Length -gt ($p.Length + 2)) {
      return $true
    }
  }
  return $false
}

function Get-Stem([string]$verb) {
  if ($verb.EndsWith('eln')) {
    return $verb.Substring(0, $verb.Length - 3) + 'el'
  }
  if ($verb.EndsWith('ern')) {
    return $verb.Substring(0, $verb.Length - 1)
  }
  if ($verb.EndsWith('en')) {
    return $verb.Substring(0, $verb.Length - 2)
  }
  if ($verb.EndsWith('n')) {
    return $verb.Substring(0, $verb.Length - 1)
  }
  return $verb
}

function Needs-E([string]$stem) {
  if ($stem -match '(d|t)$') { return $true }
  if ($stem -match '[^aeiouäöüüy][mn]$') { return $true }
  return $false
}

function Du-Ending([string]$stem) {
  if ($stem -match '(s|ß|x|z|tz|ss)$') { return 't' }
  return 'st'
}

function E([bool]$needs) { if ($needs) { return 'e' } return '' }

function Build-RegularForms([string]$verb, [bool]$isSeparable, [string]$prefix) {
  $stem = Get-Stem $verb
  $needsE = Needs-E $stem
  $duEnd = Du-Ending $stem
  $e = E $needsE

  $presentIch = $stem + 'e'
  $presentDu = $stem + $e + $duEnd
  $presentEr = $stem + $e + 't'
  $presentWir = $verb
  $presentIhr = $stem + $e + 't'
  $presentSie = $verb

  $preteriteBase = $stem + $e + 'te'

  $k1Ich = $stem + 'e'
  $k1Du = $stem + 'est'
  $k1Er = $stem + 'e'
  $k1Wir = $verb
  $k1Ihr = $stem + 'et'
  $k1Sie = $verb

  $partizipI = $stem + 'end'

  $partizipIISuffix = 't'
  if (-not $verb.ToLowerInvariant().EndsWith('ieren')) {
    if (Needs-E $stem) { $partizipIISuffix = 'et' }
  }

  $isInseparable = Is-InseparablePrefix $verb
  if ($isSeparable) {
    $partizipII = $prefix + 'ge' + $stem + $partizipIISuffix
  } elseif ($isInseparable -or $verb.ToLowerInvariant().EndsWith('ieren')) {
    $partizipII = $stem + $partizipIISuffix
  } else {
    $partizipII = 'ge' + $stem + $partizipIISuffix
  }

  function With-Prefix([string]$form) {
    if (-not $isSeparable) { return $form }
    return ($form + ' ' + $prefix)
  }

  $forms = [ordered]@{
    present = @{
      ich = With-Prefix $presentIch
      du = With-Prefix $presentDu
      er = With-Prefix $presentEr
      wir = With-Prefix $presentWir
      ihr = With-Prefix $presentIhr
      sie = With-Prefix $presentSie
    }
    preterite = @{
      ich = With-Prefix $preteriteBase
      du = With-Prefix ($preteriteBase + 'st')
      er = With-Prefix $preteriteBase
      wir = With-Prefix ($preteriteBase + 'n')
      ihr = With-Prefix ($preteriteBase + 't')
      sie = With-Prefix ($preteriteBase + 'n')
    }
    k1 = @{
      ich = With-Prefix $k1Ich
      du = With-Prefix $k1Du
      er = With-Prefix $k1Er
      wir = With-Prefix $k1Wir
      ihr = With-Prefix $k1Ihr
      sie = With-Prefix $k1Sie
    }
    partizipI = $partizipI
    partizipII = $partizipII
  }

  return $forms
}

function Apply-Reflexive([hashtable]$forms, [hashtable]$pronouns, [bool]$isSeparable, [string]$prefix) {
  $out = @{}
  foreach ($key in @('ich','du','er','wir','ihr','sie')) {
    $base = $forms[$key]
    $ref = $pronouns[$key]
    if ($isSeparable) {
      $core = $base -replace ('\s' + [regex]::Escape($prefix) + '$'), ''
      $out[$key] = ($core + ' ' + $ref + ' ' + $prefix)
    } else {
      $out[$key] = ($base + ' ' + $ref)
    }
  }
  return $out
}

function Build-Conjugation([string]$fullVerb, [bool]$isReflexive) {
  $verb = $fullVerb
  $prefix = $null
  $isSeparable = $false

  $maybePrefix = Get-SeparablePrefix $verb
  if ($maybePrefix -and -not (Is-InseparablePrefix $verb)) {
    $isSeparable = $true
    $prefix = $maybePrefix
    $verb = $verb.Substring($prefix.Length)
  }

  $forms = Build-RegularForms $verb $isSeparable $prefix
  $stem = Get-Stem $verb
  $needsE = Needs-E $stem
  $impDuCore = $stem + (E $needsE)

  $refPronouns = @{
    ich = 'mich'
    du = 'dich'
    er = 'sich'
    wir = 'uns'
    ihr = 'euch'
    sie = 'sich'
  }

  $refSpace = @{}
  foreach ($k in $refPronouns.Keys) {
    $refSpace[$k] = if ($isReflexive) { $refPronouns[$k] + ' ' } else { '' }
  }

  $indikativPraesens = $forms.present
  $indikativPraeteritum = $forms.preterite

  if ($isReflexive) {
    $indikativPraesens = Apply-Reflexive $indikativPraesens $refPronouns $isSeparable $prefix
    $indikativPraeteritum = Apply-Reflexive $indikativPraeteritum $refPronouns $isSeparable $prefix
  }

  $perfekt = @{
    ich = 'habe ' + $refSpace.ich + $forms.partizipII
    du = 'hast ' + $refSpace.du + $forms.partizipII
    er_sie_es = 'hat ' + $refSpace.er + $forms.partizipII
    wir = 'haben ' + $refSpace.wir + $forms.partizipII
    ihr = 'habt ' + $refSpace.ihr + $forms.partizipII
    sie_formal = 'haben ' + $refSpace.sie + $forms.partizipII
  }

  $plusquamperfekt = @{
    ich = 'hatte ' + $refSpace.ich + $forms.partizipII
    du = 'hattest ' + $refSpace.du + $forms.partizipII
    er_sie_es = 'hatte ' + $refSpace.er + $forms.partizipII
    wir = 'hatten ' + $refSpace.wir + $forms.partizipII
    ihr = 'hattet ' + $refSpace.ihr + $forms.partizipII
    sie_formal = 'hatten ' + $refSpace.sie + $forms.partizipII
  }

  $futurI = @{
    ich = 'werde ' + $refSpace.ich + $fullVerb
    du = 'wirst ' + $refSpace.du + $fullVerb
    er_sie_es = 'wird ' + $refSpace.er + $fullVerb
    wir = 'werden ' + $refSpace.wir + $fullVerb
    ihr = 'werdet ' + $refSpace.ihr + $fullVerb
    sie_formal = 'werden ' + $refSpace.sie + $fullVerb
  }

  $futurII = @{
    ich = 'werde ' + $refSpace.ich + $forms.partizipII + ' haben'
    du = 'wirst ' + $refSpace.du + $forms.partizipII + ' haben'
    er_sie_es = 'wird ' + $refSpace.er + $forms.partizipII + ' haben'
    wir = 'werden ' + $refSpace.wir + $forms.partizipII + ' haben'
    ihr = 'werdet ' + $refSpace.ihr + $forms.partizipII + ' haben'
    sie_formal = 'werden ' + $refSpace.sie + $forms.partizipII + ' haben'
  }

  $k1Praesens = @{
    ich = $forms.k1.ich
    du = $forms.k1.du
    er = $forms.k1.er
    wir = $forms.k1.wir
    ihr = $forms.k1.ihr
    sie = $forms.k1.sie
  }

  if ($isReflexive) {
    $k1Praesens = Apply-Reflexive $k1Praesens $refPronouns $isSeparable $prefix
  }

  $k1Perfekt = @{
    ich = 'habe ' + $refSpace.ich + $forms.partizipII
    du = 'habest ' + $refSpace.du + $forms.partizipII
    er_sie_es = 'habe ' + $refSpace.er + $forms.partizipII
    wir = 'haben ' + $refSpace.wir + $forms.partizipII
    ihr = 'habet ' + $refSpace.ihr + $forms.partizipII
    sie_formal = 'haben ' + $refSpace.sie + $forms.partizipII
  }

  $k1Futur = @{
    ich = 'werde ' + $refSpace.ich + $fullVerb
    du = 'werdest ' + $refSpace.du + $fullVerb
    er_sie_es = 'werde ' + $refSpace.er + $fullVerb
    wir = 'werden ' + $refSpace.wir + $fullVerb
    ihr = 'werdet ' + $refSpace.ihr + $fullVerb
    sie_formal = 'werden ' + $refSpace.sie + $fullVerb
  }

  $k2Praeteritum = @{
    ich = $indikativPraeteritum.ich
    du = $indikativPraeteritum.du
    er_sie_es = $indikativPraeteritum.er
    wir = $indikativPraeteritum.wir
    ihr = $indikativPraeteritum.ihr
    sie_formal = $indikativPraeteritum.sie
  }

  $k2Plusquamperfekt = @{
    ich = 'hätte ' + $refSpace.ich + $forms.partizipII
    du = 'hättest ' + $refSpace.du + $forms.partizipII
    er_sie_es = 'hätte ' + $refSpace.er + $forms.partizipII
    wir = 'hätten ' + $refSpace.wir + $forms.partizipII
    ihr = 'hättet ' + $refSpace.ihr + $forms.partizipII
    sie_formal = 'hätten ' + $refSpace.sie + $forms.partizipII
  }

  $k2Futur = @{
    ich = 'würde ' + $refSpace.ich + $fullVerb
    du = 'würdest ' + $refSpace.du + $fullVerb
    er_sie_es = 'würde ' + $refSpace.er + $fullVerb
    wir = 'würden ' + $refSpace.wir + $fullVerb
    ihr = 'würdet ' + $refSpace.ihr + $fullVerb
    sie_formal = 'würden ' + $refSpace.sie + $fullVerb
  }

  $k2Futur2 = @{
    ich = 'würde ' + $refSpace.ich + $forms.partizipII + ' haben'
    du = 'würdest ' + $refSpace.du + $forms.partizipII + ' haben'
    er_sie_es = 'würde ' + $refSpace.er + $forms.partizipII + ' haben'
    wir = 'würden ' + $refSpace.wir + $forms.partizipII + ' haben'
    ihr = 'würdet ' + $refSpace.ihr + $forms.partizipII + ' haben'
    sie_formal = 'würden ' + $refSpace.sie + $forms.partizipII + ' haben'
  }

  if ($isSeparable) {
    $imperativDu = $impDuCore + ' ' + $prefix
  } else {
    $imperativDu = $impDuCore
  }
  $imperativIhr = $forms.present.ihr
  $imperativSie = $forms.present.sie

  if ($isReflexive) {
    $imperativDu = $imperativDu + ' ' + $refPronouns.du
    $imperativIhr = $imperativIhr + ' ' + $refPronouns.ihr
    $imperativSie = $imperativSie + ' Sie ' + $refPronouns.sie
    if ($isSeparable) {
      $imperativDu = $imperativDu + ' ' + $prefix
      $imperativIhr = $imperativIhr + ' ' + $prefix
      $imperativSie = $imperativSie + ' ' + $prefix
    }
  } else {
    if ($isSeparable) {
      $imperativDu = $imperativDu + ' ' + $prefix
      $imperativIhr = $imperativIhr + ' ' + $prefix
      $imperativSie = $imperativSie + ' Sie ' + $prefix
    } else {
      $imperativSie = $imperativSie + ' Sie'
    }
  }

  return [ordered]@{
    indikativ = [ordered]@{
      praesens = [ordered]@{
        ich = $indikativPraesens.ich
        du = $indikativPraesens.du
        er_sie_es = $indikativPraesens.er
        wir = $indikativPraesens.wir
        ihr = $indikativPraesens.ihr
        sie_formal = $indikativPraesens.sie
      }
      praeteritum = [ordered]@{
        ich = $indikativPraeteritum.ich
        du = $indikativPraeteritum.du
        er_sie_es = $indikativPraeteritum.er
        wir = $indikativPraeteritum.wir
        ihr = $indikativPraeteritum.ihr
        sie_formal = $indikativPraeteritum.sie
      }
      perfekt = [ordered]@{
        ich = $perfekt.ich
        du = $perfekt.du
        er_sie_es = $perfekt.er_sie_es
        wir = $perfekt.wir
        ihr = $perfekt.ihr
        sie_formal = $perfekt.sie_formal
      }
      plusquamperfekt = [ordered]@{
        ich = $plusquamperfekt.ich
        du = $plusquamperfekt.du
        er_sie_es = $plusquamperfekt.er_sie_es
        wir = $plusquamperfekt.wir
        ihr = $plusquamperfekt.ihr
        sie_formal = $plusquamperfekt.sie_formal
      }
      futur_i = [ordered]@{
        ich = $futurI.ich
        du = $futurI.du
        er_sie_es = $futurI.er_sie_es
        wir = $futurI.wir
        ihr = $futurI.ihr
        sie_formal = $futurI.sie_formal
      }
      futur_ii = [ordered]@{
        ich = $futurII.ich
        du = $futurII.du
        er_sie_es = $futurII.er_sie_es
        wir = $futurII.wir
        ihr = $futurII.ihr
        sie_formal = $futurII.sie_formal
      }
    }
    konjunktiv_i = [ordered]@{
      praesens = [ordered]@{
        ich = $k1Praesens.ich
        du = $k1Praesens.du
        er_sie_es = $k1Praesens.er
        wir = $k1Praesens.wir
        ihr = $k1Praesens.ihr
        sie_formal = $k1Praesens.sie
      }
      perfekt = [ordered]@{
        ich = $k1Perfekt.ich
        du = $k1Perfekt.du
        er_sie_es = $k1Perfekt.er_sie_es
        wir = $k1Perfekt.wir
        ihr = $k1Perfekt.ihr
        sie_formal = $k1Perfekt.sie_formal
      }
      futur_i = [ordered]@{
        ich = $k1Futur.ich
        du = $k1Futur.du
        er_sie_es = $k1Futur.er_sie_es
        wir = $k1Futur.wir
        ihr = $k1Futur.ihr
        sie_formal = $k1Futur.sie_formal
      }
    }
    konjunktiv_ii = [ordered]@{
      praeteritum = [ordered]@{
        ich = $k2Praeteritum.ich
        du = $k2Praeteritum.du
        er_sie_es = $k2Praeteritum.er_sie_es
        wir = $k2Praeteritum.wir
        ihr = $k2Praeteritum.ihr
        sie_formal = $k2Praeteritum.sie_formal
      }
      plusquamperfekt = [ordered]@{
        ich = $k2Plusquamperfekt.ich
        du = $k2Plusquamperfekt.du
        er_sie_es = $k2Plusquamperfekt.er_sie_es
        wir = $k2Plusquamperfekt.wir
        ihr = $k2Plusquamperfekt.ihr
        sie_formal = $k2Plusquamperfekt.sie_formal
      }
      futur_i = [ordered]@{
        ich = $k2Futur.ich
        du = $k2Futur.du
        er_sie_es = $k2Futur.er_sie_es
        wir = $k2Futur.wir
        ihr = $k2Futur.ihr
        sie_formal = $k2Futur.sie_formal
      }
      futur_ii = [ordered]@{
        ich = $k2Futur2.ich
        du = $k2Futur2.du
        er_sie_es = $k2Futur2.er_sie_es
        wir = $k2Futur2.wir
        ihr = $k2Futur2.ihr
        sie_formal = $k2Futur2.sie_formal
      }
    }
    imperativ = [ordered]@{
      praesens = [ordered]@{
        du = $imperativDu
        ihr = $imperativIhr
        sie_formal = $imperativSie
      }
    }
    partizip = [ordered]@{
      partizip_i = $forms.partizipI
      partizip_ii = $forms.partizipII
    }
    infinitiv = [ordered]@{
      praesens = $fullVerb
    }
  }
}

$addedRegular = 0
$addedReflexive = 0
$skipIds = @('verb1','verb2')

foreach ($entry in $data) {
  if (-not ($entry.type -eq 'Verb' -or $entry.category -eq 'Verben')) { continue }
  $word = [string]$entry.word
  if (-not $word) { continue }

  $isReflexive = $word.StartsWith('sich ')
  $baseWord = $word
  if ($isReflexive) { $baseWord = $word.Substring(5) }

  if (-not (Is-RegularVerb $baseWord)) { continue }
  if ($skipIds -contains $entry.id) { continue }

  $conj = Build-Conjugation $baseWord $isReflexive
  if ($entry.PSObject.Properties.Name -contains 'conjugation') {
    $entry.conjugation = $conj
  } else {
    $entry | Add-Member -MemberType NoteProperty -Name 'conjugation' -Value $conj
  }

  if ($isReflexive) { $addedReflexive++ } else { $addedRegular++ }
}

$data | ConvertTo-Json -Depth 15 | Set-Content -Encoding UTF8 js/words.json

"added_regular=$addedRegular"
"added_reflexive=$addedReflexive"
