const fs = require('fs')

const list = JSON.parse(fs.readFileSync('dict-twblg.json').toString('utf-8'))
const listExt = JSON.parse(fs.readFileSync('dict-twblg-ext.json').toString('utf-8'))

const toPOJ = tl => tl.replace(/(o)([^.!?,\w\s\u2011]*)o/ig, '$1$2\u0358') // oo -> o͘
.replace(/ts/g, 'ch')
.replace(/Ts/g, 'Ch')
.replace(/u([^-‑\w\s]*)a/g, 'o$1a') // ua -> oa
.replace(/u([^-‑\w\s]*)e/g, 'o$1e') // ue -> oe
.replace(/i([^-‑\w\s]*)k($|[-‑\s])/g, 'e$1k$2') // ik -> ek
.replace(/i([^-‑\w\s]*)ng/g, 'e$1ng') // ing -> eng
.replace(/nn($|[-‑\s])/g, 'ⁿ$1') // nn -> ⁿ
.replace(/nnh($|[-‑\s])/g, 'hⁿ$1') // nnh -> hⁿ
.replace(/([ie])r/g, '$1\u0358') // ir -> i͘, er -> e͘
.replace(/\u030B/g, "\u0306") // 9th tone,  ̋ ->  ̆

const removeTone = tl => tl.replace(/[\u0300\u0301\u0302\u0304\u0306\u030b\u030d]/g, '')

const splitExample = ex => {
  const m1 = ex.indexOf('\ufff9')
  const m2 = ex.indexOf('\ufffa')
  const m3 = ex.indexOf('\ufffb')
  const hanzi = ex.substring(m1 + 1, m2).trim()
  const tailo = ex.substring(m2 + 1, m3).trim()
  const hanyu = ex.substring(m3 + 1).trim()
  return hanyu === '' ? [hanzi, tailo] : [hanzi, tailo, hanyu]
}

const heteronyms = (title, h) => {
  const body = () => {
    const definition = d =>
      d.def.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;') +
      example(d.example)

    const example = (exs) => {
      if (!exs) {
        return ''
      } else {
        return `<ul class="example">
          ${exs.map(e => {
            let [hanzi, tailo, hanyu] = splitExample(e)
            const should_inline = !hanyu || (hanzi.length <= 5 && hanyu.length <= 5)
            const inline_class = should_inline ? 'single_line' : ''

            return `<li>
              <div class="example_hanzi ${inline_class}">${hanzi.replace(title, `<strong>${title}</strong>`)}</div>
              <div d:pr="TL" class="example_tailo ${inline_class}">${tailo}</div>
              <div d:pr="POJ" class="example_tailo ${inline_class}">${toPOJ(tailo)}</div>
              <div class="example_hanyu ${inline_class}">${hanyu ? `(${hanyu})` : ''}</div>
            </li>`
          }).join('\n')}
        </ul>`
      }
    }

    const defs = h.definitions.map(definition)
    const circled_number = '⓪①②③④⑤⑥⑦⑧⑨⑩⑪⑫⑬⑭⑮⑯⑰⑱⑲⑳㉑㉒㉓㉔㉕㉖㉗㉘㉙㉚';
    let result = ''
    if (h.synonyms) { // 同義
      result += `<p class="synonyms">≈ ${h.synonyms.split(',').join('；')}</p>`
    }
    if (h.antonyms) { // 反義
      result += `<p class="antonyms">↔︎ ${h.antonyms.split(',').join('；')}</p>`
    }
    if (h.definitions.length === 1) {
      result += `<div class="def_element">${defs}</div>`
    } else {
      result += `<div class="def">
        ${defs.map((d, ith) => `<section>
          <div class="def_no">${circled_number[ith + 1]}</div>
          <div class="def_element">${d}</div></section>`).join('\n')}
      </div>`
    }
    return result
  }

  return `<h1>${title + (h.reading ? `<span class="reading">${h.reading}</span>` : '') }
      <span class="syntax">
        <span d:pr="TL">/ ${h.trs.split('/').join(' / ')} /</span>
        <span d:pr="POJ">/ ${h.trs.split('/').map(toPOJ).join(' / ')} /</span>
      </span>
    </h1>
    <div class="body">
      ${body(h)}
    </div>`
}

const indexes = (title, h) => {
  const yomi = h.trs.split('/')[0]
  const values = new Set([title, ...h.trs.split('/'), ...h.trs.split('/').map(toPOJ)])
  return [...values].map(v => `<d:index d:value="${v}" d:yomi="${yomi}" />`).join('\n')
}

const entry = e =>  e.heteronyms.map(h => `<d:entry id="${h.id}" d:title="${e.title}">
  ${ indexes(e.title, h) + heteronyms(e.title, h) }
  </d:entry>
`).join('\n')


const front_back_matter = `<main id="front_and_back">
<h1 id="dic_name">教育部<br />台語常用詞辭典</h1>
<hr />
<div id="edition">2018年修訂版</div>
<hr />
<article>
<h2>授權</h2>
<dl>
  <dt>原始資料</dt>
  <dd><a href="https://twblg.dict.edu.tw/holodict_new/">教育部《臺灣閩南語常用詞辭典》</a>文字部分，採用<a href="https://twblg.dict.edu.tw/holodict_new/compile1_6_1.jsp">創用CC姓名標示-禁止改作 3.0 臺灣 授權條款</a>。</dd>
  <dt>結構化資料</dt>
  <dd>採用<a href="https://github.com/g0v/moedict-data-twblg">g0v/moedict-data-twblg</a>整理過後的JSON。</dd>
  <dt>字體</dt>
  <dd>ButTaiwan製作的<a href="https://github.com/ButTaiwan/genseki-font">源石黑體</a>，採用 <a href="https://opensource.org/licenses/OFL-1.1">SIL Open Font License 1.1</a> 授權。</dd>
</dl>
</article>
</main>
`

let output = `<?xml version="1.0" encoding="UTF-8"?>
<d:dictionary xmlns="http://www.w3.org/1999/xhtml" xmlns:d="http://www.apple.com/DTDs/DictionaryService-1.0.rng">
${list.map(e => entry(e)).join('\n')}
${listExt.map(e => entry(e)).join('\n')}
<d:entry id="front_back_matter" d:title="Front/Back Matter">
<d:index d:value="(front/back matter)" />
${front_back_matter}
</d:entry>
</d:dictionary>
`
fs.writeFileSync('sutian.xml', output)

let test = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Test</title>
  <link href="sutian.css" rel="stylesheet">
</head>
<body>
`
for (let idx = 100; idx < 150; idx++) {
  const e = list[idx]
  test += e.heteronyms.map(h => heteronyms(e.title, h)).join('\n')
}
test += '</body>'
fs.writeFileSync('test.html', test)
