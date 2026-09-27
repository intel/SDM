"use strict";

// Copyright (C) 2025-2026 Intel Corporation

function mk_other_links(code, extra_links) {
    let links = [];
    for (const ref of code.getElementsByTagName('other-copy')) {
        const f = ref.textContent;
        const link = extra_links[f];
        if (link) {
            links.push(link);
        } else {
            links.push(f);
        }
    };
    let line = "";
    if (links.length > 0) {
        line += `<bold>Related instructions</bold>: This specification is shared with ` + links.join(', ') + "<br>";
    }
    return line;
}

function mk_callgraph(operation, extra_links) {
    let section = "";
    section += `<div class='callgraph' style='display:block'>`;
    section += mk_code_links(operation, "Called by", "caller");
    section += mk_code_links(operation, "Calls", "callee");
    section += mk_code_links(operation, "Variable used by", "var-user");
    section += mk_code_links(operation, "Variables", "var-used");
    section += mk_other_links(operation, extra_links);
    section += "</div>";
    return section;
}

function render_operation(operation, extra_links) {
    let section = "";
    section += render_ISA(operation.getElementsByTagName('code'), extra_links);
    section += mk_callgraph(operation, extra_links);
    return section;
}

function render_intrinsic(intrinsics) {
    let section = "";
    if (intrinsics.length > 0) {
        section += "<h2>Intel C/C++ Compiler Intrinsic Equivalent</h2>";
        for (const intrinsic of intrinsics) {
            section += render_intrinsic_function(intrinsic);
        }
    }
    return section;
}

function add_tooltip(text, tip, url) {
    let link = text;
    if (url) {
        link = "<a href='" + url + "'>" + link + "</a>";
    }
    if (tip) {
        link = `<div class='tooltip'>${link}<span class='tooltiptext'>${tip}</span></div>`;
    }
    return link;
}

function render_intrinsic_function(intrinsic) {
    let s = "";
    const name = intrinsic.getAttribute('name');
    const ret = intrinsic.getElementsByTagName('return')[0];
    const url = "https://www.intel.com/content/www/us/en/docs/intrinsics-guide/index.html#text="+name;
    const params = Array.from(intrinsic.getElementsByTagName('parameter')).map((p) => p.getAttribute('type') +" "+ p.getAttribute('varname'))
    const longdesc = intrinsic.getElementsByTagName('description')[0].textContent;
    // todo: can we use the operation elements too?
    const link = add_tooltip(name, longdesc, url);
    const sig = ret.getAttribute('type') +" " + link + "(" + params.join(", ") + ");";
    s += "<div class='signature'>";
    s += sig;
    s += "</div>";
    return s;
}

const boring_inputs = [
    'cond',
    'context',
    'dfv',
    'is_mem_operand',
    'is_memory_operand',
    'mod',
    'next_ip',
    'old',
    'scc',
    'src_index',
    "context",
    "mod",
];

function render_asm_syntax(syntax) {
    let text = syntax.getAttribute('mnemonic');
    for (const m of syntax.getElementsByTagName('asm-modifier')) {
        text += " " + m.innerHTML;
    }
    for (const o of syntax.getElementsByTagName('asm-operand')) {
        text += " " + o.innerHTML;
    }
    return text
}

function render_iforms_solo(groups, intrinsics, performance, extra_links) {
    if (groups.length == 0) {
        return "";
    }

    let s = "";
    s += "<details><summary><h3>Further encoding details</h3></summary>";

    let seen = [];
    for (const iforms of groups) {
        for (const iform of iforms) {
            const xed_name = iform.getAttribute('xed_iform');
            const encoding = iform.getAttribute('encoding');
            const valid64 = iform.getAttribute('valid64');
            const valid32 = iform.getAttribute('valid32');

            if (seen.includes(xed_name)) {
                continue;
            }
            seen.push(xed_name);

            let syntax = iform.getElementsByTagName('assembly-syntax')[0];
            const asm_mnemonic = syntax.getAttribute('mnemonic');
            const asm_modifiers = syntax.getElementsByTagName('asm-modifier')
            const asm_operands = syntax.getElementsByTagName('asm-operand')

            syntax = asm_mnemonic;
            let suffix = "";
            for (const modifier of Array.from(asm_modifiers)) {
                const priority = modifier.getAttribute('priority');
                if (priority == "1") {
                    syntax = syntax + " " + modifier.innerHTML;
                } else {
                    suffix = suffix + " " + modifier.innerHTML;
                }
            }
            let operands = [];
            for (const operand of Array.from(asm_operands)) {
                operands.push(operand.innerHTML);
            }
            if (operands.length) {
                syntax = syntax + " " + operands.join(", ");
            }
            if (suffix) {
                syntax = syntax + " " + suffix;
            }

            const cpuid_groups = Array.from(iform.getElementsByTagName('cpuid-group'));
            const cpuids = cpuid_groups.map(group => {
                const row = Array.from(group.getElementsByTagName('cpuid-flag')).map(x => x.textContent);
                let g = row.join(" & ");
                if (row.length > 1 && groups.length > 1) {
                    g = '(' + g + ')';
                }
                return g;
                });
            const cpuid = cpuids.join(" | ")

            s += `<details class='iform' name='iform'>`;
            s += `<summary><span class='iform-asm'>${syntax}</span> <span class='iform-name'>${xed_name}</span></summary>`;

            if (cpuid != "") {
                s += `<para>CPUID restrictions: ${cpuid}</para>`;
            }

            s += `<para>Encoding-specific code to read any operands before the operation and write back any result operands.</para>`;

            let code = [];
            code.push(...iform.getElementsByTagName('decode_args')[0].getElementsByTagName('code'));
            code.push(...iform.getElementsByTagName('read_instr')[0].getElementsByTagName('code'));
            code.push(...iform.getElementsByTagName('pre_execute')[0].getElementsByTagName('code'));
            code.push(...iform.getElementsByTagName('execute')[0].getElementsByTagName('code'));
            code.push(...iform.getElementsByTagName('post_execute')[0].getElementsByTagName('code'));

            // patch the code by replacing the "Instr_FOO(...)" call with "<Operation>" to avoid a dangling reference
            code.forEach(line => line.textContent = line.textContent.replace(/Instr_.*/, `⟪Operation⟫;`));

            s += render_ISA(code, extra_links);
            s += mk_callgraph(iform, extra_links);

            function is_relevant_intrinsic(intrinsic) {
                for (const instruction of intrinsic.getElementsByTagName('instruction')) {
                    if (instruction.getAttribute('xed') == xed_name) {
                        return true;
                    }
                }
                return false;
            }

            const is = intrinsics.filter(is_relevant_intrinsic);
            if (is.length > 0) {
                s += "<h5>Intel C/C++ Compiler Intrinsic Equivalent</h5>";
                for (const intrinsic of is) {
                    s += render_intrinsic_function(intrinsic);
                }
            }

            const perf = performance[xed_name];
            if (perf) {
                // s += "<h4>Performance</h4>";
                s += "<div>";
                s += "<table>";
                s += "<caption>Latency and throughput</caption>";
                s += "<thead>";
                s += "<th>Architecture</th>";
                s += "<th>Latency</th>";
                s += "<th>Throughput (CPI)</th>";
                s += "</thead>";
                s += "<tbody>";
                for(const arch_data of Array.from(perf)) {
                    for(const [arch,data] of Object.entries(arch_data)) {
                        let l = data.l;
                        let t = data.t;
                        if (!l) l = "-";
                        if (!t) t = "-";
                        s += "<tr>";
                        s += "<td>"+arch+"</td>";
                        s += "<td>"+l+"</td>";
                        s += "<td>"+t+"</td>";
                        s += "</tr>";
                    }
                };
                s += "</tbody>";
                s += "</table>";
                s += "</div>";
            }

            // let enc_sizes = {};
            // for (const v of iform.querySelectorAll('encoding-size')) {
            //     const nm = v.getAttribute('name');
            //     const sz = v.getAttribute('size');
            //     enc_sizes[nm] = sz;
            // }
            // for (const v of sz_headings) {
            //     row[v] = enc_sizes[v] ?? "-";
            // }

            // // set default strings for input/output
            // for (const v of inputs) { row[v] = '-'; }
            // for (const v of outputs) { row[v] = '-'; }

            // for (const v of iform.querySelectorAll('operand')) {
            //     const is_read = v.getAttribute('is_read') == "True";
            //     let text = "";
            //     const label = v.getElementsByTagName('label')[0];
            //     const encoding = v.getElementsByTagName('encoding')[0];
            //     if (label && encoding) {
            //         text = [ label.innerHTML, encoding.innerHTML];
            //     } else {
            //         text = [ '-', '' ];
            //     }
            //     for (const name of v.getElementsByTagName('name')) {
            //         const nm = name.textContent;
            //         if (inputs.includes(nm) || outputs.includes(nm)) {
            //             row[nm] = text;
            //         }
            //     }
            // }


            s += "</details>";
        }

    }

    s += "</details>";
    return s;
}

function render_iform_groups(sizes, inputs, outputs, footnotes, iformss) {
    if (iformss.length == 0) {
        return "<para>This instruction is not supported by the current configuration.</para>";
    }
    let sz_headings = [];
    for (const v of sizes) {
        sz_headings.push(v.getAttribute('name'));
    }
    let out_headings = [];
    for (const v of outputs) {
        out_headings.push(v);
    }
    let in_headings = [];
    for (const v of inputs) {
        in_headings.push(v);
    }

    // ungrouped headings
    let headings = [];
    headings.push("Opcode");
    headings.push("Instruction");
    headings.push("64bit");
    headings.push("16/32bit");
    headings.push("CPUID");
    headings.push(...sz_headings);
    headings.push(...out_headings);
    headings.push(...in_headings);

    // group the headings: [label, stacked, subheadings]
    let grouped_headings = [];
    grouped_headings.push([null, true, ["Opcode", "Instruction"]])
    grouped_headings.push(["Mode", true, ["64bit", "16/32bit"]])
    grouped_headings.push([null, true, ["CPUID"]])
    if (sz_headings.length > 0) {
        grouped_headings.push(["Sizes", true, sz_headings])
    }
    if (out_headings.length > 0) {
        grouped_headings.push(["Results", false, out_headings])
    }
    if (in_headings.length > 0) {
        grouped_headings.push(["Inputs", false, in_headings])
    }

    let all_rows = [];
    for (const iforms of iformss) {
        const group_rows = render_iform_group(sizes, inputs, outputs, sz_headings, footnotes, iforms);
        const merged_row = group_iforms(group_rows);
        all_rows.push(merged_row);
    }

    // filter out empty CPUID/size columns
    if (all_rows.every(row => row['CPUID'] == '')) {
        grouped_headings.map(gh => gh[2] = gh[2].filter(h => h != "CPUID"));
    }

    // return mk_flat_table(headings, all_rows, footnotes);
    return mk_grouped_table(grouped_headings, all_rows, footnotes);
}

function group_iforms(rows) {
    // Make list of all keys used in any row
    let all_keys = [];
    for (const row of rows) {
        for (const key of Object.keys(row)) {
            if (! all_keys.includes(key)) {
                all_keys.push(key);
            }
        }
    }

    // For each column in row, merge all entries
    let merged = {};
    for (const key of all_keys) {
        let entries = [];
        for (const row of rows) {
            const value = row[key];
            entries.push(value);
        }
        merged[key] = merge(entries);
    }

    // Merge all the assembly syntax fields
    let syntax = merged['asm_mnemonic'];
    delete merged['asm_mnemonic'];
    let modifiers1 = []
    let modifiers2 = []
    let operands = []
    for (const [key, value] of Object.entries(merged)) {
        if (key.startsWith('asm_modifier1')) {
            modifiers1.push(value)
            delete merged[key];
        } else if (key.startsWith('asm_modifier2')) {
            modifiers2.push(value)
            delete merged[key];
        } else if (key.startsWith('asm_operand')) {
            operands.push(value)
            delete merged[key];
        }
    }
    if (modifiers1.length != 0) {
        syntax = syntax + " " + modifiers1.join(" ");
    }
    if (operands.length != 0) {
        syntax = syntax + " " + operands.join(", ");
    }
    if (modifiers2.length != 0) {
        syntax = syntax + " " + modifiers2.join(" ");
    }
    merged['Instruction'] = syntax;

    return merged;
}

// Merge an array of strings or an array of arrays of strings
function merge(entries) {
    if (Array.isArray(entries[0])) {
        let r = [];
        const l = entries[0].length;
        for (let i = 0; i < l; i++) {
            let row = [];
            for (const col of entries) {
                row.push(col[i]);
            }
            r.push(merge(row));
        }
        return r;
    } else {
        return unique(entries).join("/");
        // const ss = unique(entries);
        // if (ss.length == 1) {
        //     return ss[0];
        // } else {
        //     return entries.join("/");
        // }
    }
}

function unique(strings) {
    let rs = [];
    for (const string of strings) {
        if (!rs.includes(string)) {
            rs.push(string);
        }
    }
    return rs;
}

// Table mapping CPID names like 'SSE2MMX' to a list of flags such as
// ["SSE2.1.0.EDX[26]=1", "MMX.1.0.EDX[23]=1"]
let cpuid_expansions = {
};

function add_cpuid_tooltip(cpuid_name) {
    const expansion = cpuid_expansions[cpuid_name];
    return add_tooltip(cpuid_name, expansion, null);
}

function render_iform_group(sizes, inputs, outputs, sz_headings, footnotes, iforms) {
    let rows = [];
    for (const iform of iforms) {
        let row = {
            "Opcode": iform.getAttribute('encoding'),
            "64bit": iform.getAttribute('valid64'),
            "16/32bit": iform.getAttribute('valid32'),
        };

        const groups = Array.from(iform.getElementsByTagName('cpuid-group'));
        const cpuids = groups.map(group => {
            const row = Array.from(group.getElementsByTagName('cpuid-flag'))
                        .map(x => add_cpuid_tooltip(x.textContent));

            let g = row.join(" & ");
            if (row.length > 1 && groups.length > 1) {
                g = '(' + g + ')';
            }
            return g;
            });
        let cpuid = cpuids.join("<br> | ")
        row["CPUID"] = cpuid;

        // Note: the assembly syntax fields are initially treated as independent columns
        // to allow individual operands to be merged before combining the columns into
        // a single entry.
        const syntax = iform.getElementsByTagName('assembly-syntax')[0];
        row['asm_mnemonic'] = syntax.getAttribute('mnemonic');
        for (const [i, m] of Array.from(syntax.getElementsByTagName('asm-modifier')).entries()) {
            const priority = m.getAttribute('priority')
            row['asm_modifier' + priority +'_' + i] = m.innerHTML;
        }
        for (const [i, o] of Array.from(syntax.getElementsByTagName('asm-operand')).entries()) {
            row['asm_operand' + i] = o.outerHTML;
        }

        let enc_sizes = {};
        for (const v of iform.querySelectorAll('encoding-size')) {
            const nm = v.getAttribute('name');
            const sz = v.getAttribute('size');
            enc_sizes[nm] = sz;
        }
        for (const v of sz_headings) {
            row[v] = enc_sizes[v] ?? "-";
        }

        // set default strings for input/output
        for (const v of inputs) { row[v] = '-'; }
        for (const v of outputs) { row[v] = '-'; }

        for (const v of iform.querySelectorAll('operand')) {
            const is_read = v.getAttribute('is_read') == "True";
            let text = "";
            const label = v.getElementsByTagName('label')[0];
            const encoding = v.getElementsByTagName('encoding')[0];
            if (label && encoding) {
                text = [ label.innerHTML, encoding.innerHTML];
            } else {
                text = [ '-', '' ];
            }
            for (const name of v.getElementsByTagName('name')) {
                const nm = name.textContent;
                if (inputs.includes(nm) || outputs.includes(nm)) {
                    row[nm] = text;
                }
            }
        }
        rows.push(row);
    }

    return rows;
}

// Create a grouped table with multiple entries in each column
function mk_grouped_table(headings, rows, footnotes) {
    let table = "";
    table += "<table class='encoding-table'>";
    table += "<thead>";
    table += "<tr>";
    let width = 0;
    for (const h of headings) {
        const label = h[0] ?? "";
        const stacked = h[1];
        const num_subheadings = h[2].length;
        if (num_subheadings > 0) {
            if (stacked) {
                table += "<th>" + label + "</th>";
                width += 1;
            } else {
                    table += `<th colspan=${num_subheadings}>` + label + "</th>";
                    width += num_subheadings;
            }
        }
    }
    table += "</tr>";
    table += "<tr>";
    for (const h of headings) {
        const stacked = h[1];
        const num_subheadings = h[2].length;
        if (num_subheadings > 0) {
            if (stacked) {
                const label = h[2].join("<br>")
                table += "<th>" + label + "</th>";
            } else {
                for (const label of h[2]) {
                    table += "<th>" + label + "</th>";
                }
            }
        }
    }
    table += "</tr>";
    table += "</thead>";
    let body = "<tbody>";
    for (const row of rows) {
        body += "<tr>";
        for (const h of headings) {
            const stacked = h[1];
            const num_subheadings = h[2].length;
            if (num_subheadings > 0) {
                if (stacked) {
                    let content = [];
                    for (const sh of h[2]) {
                        let t = row[sh];
                        if (Array.isArray(t)) {
                            t = t.join("<br>");
                        }
                        content.push(t);
                    }
                    body += "<td>" + content.join("<br>") + "</td>";
                } else {
                    for (const sh of h[2]) {
                        let t = row[sh];
                        if (Array.isArray(t)) {
                            t = t.join("<br>");
                        }
                        body += "<td>" + t + "</td>";
                    }
                }
            }
        }
        body += "</tr>";
    }
    body += "</tbody>";

    // note that <tfoot> elements need to come *before* <tbody> elements
    table += render_footnotes(footnotes, width);
    table += body;
    table += "</table>";
    return table
}

// Create a flat table with one entry in each column
function mk_flat_table(headings, rows, footnotes) {
    let table = "";
    table += "<table class='encoding-table'>";
    table += "<thead>";
    table += "<tr>";
    for (const h of headings) {
        table += "<th>" + h + "</th>";
    }
    table += "</tr>";
    table += "</thead>";

    let body = "<tbody>";
    for (const row of rows) {
        body += "<tr>";
        for (const h of headings) {
            let t = row[h];
            if (Array.isArray(t)) {
                t = t.join("<br>");
            }
            body += "<td>" + t + "</td>";
        }
        body += "</tr>";
    }
    body += "</tbody>";

    // note that <tfoot> elements need to come *before* <tbody> elements
    table += render_footnotes(footnotes, headings.length);
    table += body;
    table += "</table>";
    return table
}

function render_footnotes(footnotes, width) {
    let table = "";
    footnotes = Array.from(footnotes);
    if (footnotes.length > 0) {
        table += "<tfoot>";
        table += "<tr><th class='table-notes'>NOTES:</th></tr>";
        table += `<tr><td colspan=${width}>`;
        table += `<div class='footnotes'>`;
        for (const footnote of footnotes) {
            table += "<div class='footmark'>";
            table += footnote.getAttribute('id');
            table += ". ";
            table += "</div>";
            table += "<div class='footnote'>";
            table += footnote.innerHTML;
            table += "</div>";
        }
        table += `</div></td><tr>`;
        table += "</tfoot>";
    }
    return table;
}

function render_table(x) {
    let tbl = document.createElement('table');
    let body = document.createElement('tbody');
    tbl.appendChild(body);
    for (const r of x.getElementsByTagName('tr')) {
        let row = document.createElement('tr');
        body.appendChild(row);
        for (const e of r.getElementsByTagName('entry')) {
            let entry = document.createElement('td');
            row.appendChild(entry);
            entry.innerHTML = e.innerHTML;
        }
    }
    return tbl;
}

function render_related(name, data_xml) {
    const others = Array.from(data_xml.getElementsByTagName('other-copy'));
    const rs = others.map((x) => {
        const name = x.textContent;
        return make_code_link(name, name, 'instruction');
    });

    if (rs.length > 0) {
        return "Related instructions: " + unique(rs).join(", ") + "<br>";
    } else {
        return "";
    }
}

function render_instruction(intrinsics_idx, performance_idx, text_xml, data_xml) {
    text_xml = patch_docbook(text_xml, false);
    data_xml = patch_docbook(data_xml, false);
    const extra_links = make_instruction_highlighting_table(data_xml)

    const name        = text_xml.getAttribute('name');
    const shortdesc   = text_xml.getElementsByTagName('shortdesc')[0];
    const longdesc    = text_xml.getElementsByTagName('longdesc')[0];
    const subsections = text_xml.getElementsByTagName('subsection');

    const operations = data_xml.getElementsByTagName('operation');
    const xrefs      = data_xml.getElementsByTagName('xref');
    const xed_names = Array.from(data_xml.getElementsByTagName('iform')).map((i) => i.getAttribute('xed_iform'));
    const intrinsics = find_intrinsics(intrinsics_idx, xed_names);

    let section = `<h1>${name}—${shortdesc.innerHTML}</h1>`;
    section += render_categories("Instruction categories: ", data_xml);
    section += render_related(name, data_xml);

    let cpuids = new Set([]);
    for (const group of data_xml.getElementsByTagName('iform-group')) {
        for (const iform of group.getElementsByTagName('iform')) {
            for (const cpuid_group of iform.getElementsByTagName('cpuid-group')) {
                cpuids.add(cpuid_group.getAttribute('name'));
            }
        }
    }
    if (cpuids.size > 0 && current_isa_sets) {
        section += "Relevant CPUID groups:";
        for (const cpuid of cpuids) {
            let name = cpuid;
            let select = 'select_cpuid_' + name;
            let display_name = name;
            const checked = ((current_isa_sets == null) || current_isa_sets.has(name)) ? "checked" : "";
            const input = `<input type='checkbox' id='${select}' cpuid_group='${name}' onchange="toggle_cpuid_view(event)" ${checked}/>`;
            const label = `<label for='${select}'>${display_name}</label>`;
            section += ` ${input}${label}`;
        }
        section += "<br>";
    }
    // section += render_cpuids(name, data_xml);

    const sizes = data_xml.getElementsByTagName('size');
    const inputs = Array.from(data_xml.getElementsByTagName('input')).map(x => x.getAttribute('name')).filter(x => !boring_inputs.includes(x));
    const outputs = Array.from(data_xml.getElementsByTagName('output')).map(x => x.getAttribute('name'));
    const footnotes = data_xml.querySelectorAll(':scope > footnote'); // direct children are footnotes for the encoding table
    const iform_groups = filter_iforms(data_xml.getElementsByTagName('iform-group'));
    section += render_iform_groups(sizes, inputs, outputs, footnotes, iform_groups);
    section += render_iforms_solo(iform_groups, intrinsics, performance_idx, extra_links);
    section += `<h2>Description</h2>${longdesc.innerHTML}`;

    // On pages that have specs for multiple instructions such as ROR/RCL/..., we need
    // to include the mnemonic name in the operation section title
    let needs_mnemonic_to_disambiguate = false;
    let variants = [];
    for (const operation of operations) {
        const variant_kind = operation.getAttribute('variant_kind');
        needs_mnemonic_to_disambiguate |= variants.includes(variant_kind);
        variants.push(variant_kind);
    }

    for (const operation of operations) {
        let disambiguation = [];
        if (needs_mnemonic_to_disambiguate) {
            disambiguation.push(operation.getAttribute('mnemonic'));
        }
        if (operations.length > 1) {
            let variant_kind = operation.getAttribute('variant_kind');
            disambiguation.push(variant_kind);
        }
        if (disambiguation.length == 0) {
            section += "<h2>Operation</h2>";
        } else {
            section += `<h2>Operation (${disambiguation.join(', ', disambiguation)})</h2>`;
        }
        section += render_operation(operation, extra_links);
    };

    for (const subsection of subsections) {
        const title = subsection.getAttribute('title');
        if (title.includes('Compiler Intrinsic')) {
            section += render_intrinsic(intrinsics);
        } else {
            section += `<h2>${title}</h2>${subsection.innerHTML}`;
        }
    }

    section += "<p>Copyright &copy; Intel Corporation.</p>";

    return section;
}

function render_categories(prefix, parent) {
    const categories = Array.from(parent.getElementsByTagName('category'));
    const links = categories.map((category) => {
        const c = category.textContent;
        return make_link('category', c, c);
    });
    if (links.length > 0) {
        return prefix + links.join(', ') + "<br>";
    } else {
        return "";
    }
}

function render_definition(definition) {
    const name = definition.getAttribute('name');
    const kind = definition.getAttribute('kind');
    const shortdesc = definition.getElementsByTagName('shortdesc')[0];
    const longdesc = definition.getElementsByTagName('longdesc');
    const examples = definition.getElementsByTagName('example');
    const operation = definition.getElementsByTagName('operation');
    const extra_links = make_instruction_highlighting_table(definition)

    let title = "";
    if (shortdesc.textContent) {
        title = `${name} — ${shortdesc.innerHTML}`;
    } else {
        title = name;
    }
    let section = `<h1>${title}</h1>`;
    if (longdesc) section += longdesc[0].innerHTML;

    if (examples.length > 0) {
        section += `<h2>Examples</h2>`;
        section += "<ul>";
        for (const example of examples) {
            const code = render_ISA_code(example.innerHTML, extra_links);
            section += `<li><code>${code}</code></li>`;
        }
        section += "</ul>";
    }

    section += render_categories("Categories: ", definition);
    if (operation.length > 0) {
        section += render_operation(operation[0], extra_links);
    }
    section += "<p>Copyright &copy; Intel Corporation.</p>";
    return section;
}


function render_category(index1, text_xml) {
    const name = text_xml.getElementsByTagName('name')[0].innerHTML;
    const short = patch_docbook(text_xml.getElementsByTagName('shortdesc')[0], false);
    const long = patch_docbook(text_xml.getElementsByTagName('longdesc')[0], false);
    let s = `<h1>${short.innerHTML}</h1>`;
    s = s + long.innerHTML;

    const index = index1['instructions'];
    let instrs = [];
    for (const [label, instr_name, shortdesc, categories, isa_sets, textfile, datafile] of index) {
        if (categories.includes(name)) {
            instrs.push([make_code_link(label, label, 'instruction'), shortdesc]);
        }
    }
    s += render_definition_table('<h2>Instructions</h2>', instrs);

    let definitions = [];
    for (const [definition_name, definition] of definition_index.entries()) {
        const categories = Array.from(definition.getElementsByTagName('category')).map((x) => x.textContent);
        if (categories.includes(name)) {
            const shortdesc = definition.getElementsByTagName('shortdesc')[0].innerHTML;
            definitions.push([make_code_link(definition_name, definition_name, 'definition'), shortdesc]);
        }
    }
    s += render_definition_table('<h2>Definitions</h2>', definitions);

    // Find ancestor and descendent categories
    let above = [];
    let below = [];
    for (const [c_name, c_shortdesc, f] of index1['categories']) {
        if (c_name && name != c_name) {
            if (name.startsWith(c_name)) {
                above.push([make_link('category', f, c_name), c_shortdesc]);
            } else if (c_name.startsWith(name)) {
                below.push([make_link('category', f, c_name), c_shortdesc]);
            }
        }
    }
    s += render_definition_table('<h2>Parent categories</h2>', above);
    s += render_definition_table('<h2>Sub-categories</h2>', below);
    s += "<p>Copyright &copy; Intel Corporation.</p>";
    return s;
}

function mk_diagram_config(cell_size) {
    let config = {};

    config.cell_size = cell_size;
    config.text_stroke = "black";
    config.stroke = "dimgray";
    config.connect_stroke = "dimgray";
    config.jut_stroke = "gray";
    config.reserved_color = "lightgray";
    config.reg_fill = "whitesmoke";
    config.bg_color = "white";

    // config.font = 'Helvetica';
    // config.font = 'Times New Roman';
    // config.font = 'serif';
    config.font = 'sans-serif';
    // config.font = 'Verdana';

    config.arrow_width = config.cell_size * 0.6;
    config.arrow_length = config.cell_size * 1.0;
    config.padding = config.cell_size;
    config.padding_x = config.padding;
    config.padding_y = config.padding * 2;

    config.gap_op_input = config.cell_size * 3;
    config.gap_op_output = config.cell_size * 3;

    // gap between text and the object it refers to;
    config.padding_title_x = config.cell_size * 0.2;
    config.padding_title_y = config.cell_size * 0.3;
    config.cell_height = config.cell_size * 1.5;
    config.cell_width = config.cell_size;
    config.cell_dx = 2;
    config.cell_dy = 2;
    config.jut = config.cell_height * 0.55;
    config.jut_font_size = config.cell_height * 0.50;

    config.connect_width = 0.7;
    config.connect_halo = 2;

    config.register_font_size = config.cell_height * 0.66;
    config.cell_font_size = config.cell_height * 0.66;
    config.op_font_size = config.cell_height * 0.8;

    config.line_spacing = 1.2;

    config.padding_para_x = config.cell_size * 0.3;
    config.padding_para_y = config.cell_size * 0.3;

    config.register_field_gap_x = config.cell_size;
    config.register_field_gap_y = config.cell_size * 1.5;

    return config;
}

function mk_reg_spec(reg) {
    let register = {
        name: reg.name,
        kind: 'register',
        shortdesc: reg.shortdesc,
        size: reg.size,
        fields: [],
    };
    for (const field of reg.fields) {
        if (Object.hasOwn(field, 'slices')) {
            if (field.slices.length == 1) {
                const slice = field.slices[0];
                const f = {
                    name: field.name,
                    bitIndex: slice.lsb,
                    bitWidth: slice.msb + 1 - slice.lsb,
                    longdesc: null, // field.longdesc,
                    reserved: field.unused,
                };
                register.fields.push(f);
            }
        } else {
            const f = {
                name: field.name,
                bitIndex: parseInt(field.lsb),
                bitWidth: parseInt(field.msb) + 1 - parseInt(field.lsb),
                longdesc: null, // field.longdesc,
                reserved: field.unused,
            };
            register.fields.push(f);
        }
    }
    // if (reg.alias && reg.alias.length > 0) {
    //     for (const slice of reg.alias) {
    //         let name = "";
    //         if (slice.kind == "value") {
    //             name = slice.to_value;
    //         } else if (slice.kind == "register") {
    //             name = `${slice.maps_to}[${slice.to_msb}:${slice.to_lsb}]`;
    //         }
    //         render_reg_slice(g, reg.name, reg.size, name, slice.from_msb, slice.from_lsb, false);
    //     }
    return register;
}

function render_reg_diagram(register) {
    const hscale = register.size <= 32 ? 2 : 1;
    const config = mk_diagram_config(10);
    const diagram = new Register(config, register, {title_pos: 'topleft', hscale: hscale});
    show_borders = !true;
    return render_diagram(config, diagram);
}

function render_reg_fields(reg, is_cpuid) {
    const fields = reg.fields;
    if (fields === undefined) {
        return document.createDocumentFragment();
    }
    const body = document.createElement('dl');
    body.className = 'register_fields';
    for (const field of fields) {
        if (!field.unused || field.name) {

            const regfield = document.createElement('dt');
            regfield.className = 'register_field';
            body.appendChild(regfield);

            const desc = document.createElement('dd');
            body.appendChild(desc)

            if (field.name) {
                regfield.id = `Register_field_${reg.name}.${field.name}`;
            }

            let slices = [];
            if (field.slices !== undefined) {
                for(const slice of field.slices) {
                    const lsb = slice.lsb;
                    const msb = slice.msb;
                    slices.push(lsb == msb ? lsb : `${msb}:${lsb}`);
                }
            } else {
                const lsb = field.lsb;
                const msb = field.msb;
                slices.push(lsb == msb ? lsb : `${msb}:${lsb}`);
            }
            let title = slices.join(", ");
            if (field.name) {
                title += ` — ${field.name}`;
            }
            if (field.shortdesc) {
                title += ` — ${field.shortdesc}`;
            }
            if (!field.reserved && field.name != "Reserved") {
                if (is_cpuid) {
                    title += ` (<varname>CPUID_${field.name}</varname>)`;
                }
                if (!is_cpuid) { // CPUID registers cannot be written
                    title += field.writable ? " (Writable)" : " (Not writable)";
                }
            }

            regfield.innerHTML = title;

            // Todo: add necessary information to register at
            // both variable and field granularity
            // const users = mk_code_links(reg, "Uses", "var-user");
            // if (users) {
            //     const p = document.createElement('para');
            //     p.innerHTML = users;
            //     desc.appendChild(p);
            // }

            if (field.enumeration) {
                const p = document.createElement('para');
                p.innerHTML = `Accessible if ${field.enumeration}`;
                desc.appendChild(p);
            }
            if (field.read_enumeration) {
                const p = document.createElement('para');
                p.innerHTML = `Read permitted if ${field.read_enumeration}`;
                desc.appendChild(p);
            }
            if (field.write_enumeration) {
                const p = document.createElement('para');
                p.innerHTML = `Write permitted if ${field.write_enumeration}`;
                desc.appendChild(p);
            }

            if (field.longdesc) {
                const paras = field.longdesc.split('\n');
                for (const para of paras) {
                    const p = document.createElement('para');
                    p.innerHTML = para;
                    desc.appendChild(p);
                }
            }
            if (field.cold_reset !== null && field.cold_reset !== undefined) {
                const reset = document.createElement('p');
                var text = `Reset value: ${field.cold_reset}`;
                if (field.preserve_on_warm_reset) {
                    text = text + " (preserved on warm reset)"
                }
                reset.innerHTML = text;
                desc.appendChild(reset);
            }
            if (field.processor_introduced?.length > 0) {
                const x = document.createElement('p');
                x.innerHTML = `Introduced: ${field.processor_introduced.join(', ')}`;
                desc.appendChild(x);
            }
            if (field.processor_deprecated?.length > 0) {
                const x = document.createElement('p');
                x.innerHTML = `Deprecated: ${field.processor_deprecated.join(', ')}`;
                desc.appendChild(x);
            }
        }
    }
    return body;
}

function render_reg(reg) {
    let definition = document.createElement('div');

    let title = reg.name
    if (reg.address) {
        title += ` (0x${reg.address})`;
    }
    if (reg.shortdesc) {
        title += `—${reg.shortdesc}`;
    }
    const summary = document.createElement('h1');
    summary.className = "defn_name";
    summary.innerHTML = title;
    definition.appendChild(summary)

    if (reg.kind == "MSR") {
        const warning = document.createElement('p');
        warning.className = "note";
        warning.innerHTML = "Warning: The information in this MSR entry is not yet ready for public release.";
        definition.appendChild(warning);
    }

    if (reg.longdesc) {
        for (const para of reg.longdesc.split('\n')) {
            const p = document.createElement('para');
            p.innerHTML = para;
            definition.appendChild(p);
        }
    }

    if (reg.enumeration) {
        const p = document.createElement('para');
        p.innerHTML = `Read/Write permitted if ${reg.enumeration}`;
        definition.appendChild(p);
    }
    if (reg.read_enumeration) {
        const p = document.createElement('para');
        p.innerHTML = `Read permitted if ${reg.read_enumeration}`;
        definition.appendChild(p);
    }
    if (reg.write_enumeration) {
        const p = document.createElement('para');
        p.innerHTML = `Write permitted if ${reg.write_enumeration}`;
        definition.appendChild(p);
    }

    if (reg.processor_introduced?.length > 0) {
        const x = document.createElement('p');
        x.innerHTML = `Introduced: ${reg.processor_introduced.join(', ')}`;
        definition.appendChild(x);
    }
    if (reg.processor_deprecated?.length > 0) {
        const x = document.createElement('p');
        x.innerHTML = `Deprecated: ${reg.processor_deprecated.join(', ')}`;
        definition.appendChild(x);
    }

    const diagram = render_reg_diagram(mk_reg_spec(reg));
    definition.appendChild(diagram);

    const fields = render_reg_fields(reg, false);
    definition.appendChild(fields);

    const copyright = document.createElement('p');
    copyright.innerHTML = "Copyright &copy; Intel Corporation.";
    definition.appendChild(copyright);

    return definition;
}

function render_cpuid(leaf) {
    let definition = document.createElement('div');
        let title = `${leaf.name} (${render_cpuid_label(leaf.EAX, null, null)})`;

        const heading = document.createElement('h1');
        heading.className = "defn_name";
        heading.innerHTML = title;
        definition.appendChild(heading);

        if (leaf.shortdesc) {
            for (const para of leaf.shortdesc.split(/\n|\u2022/)) {
                const p = document.createElement('para');
                p.innerHTML = para;
                definition.appendChild(p);
            }
        }

        if (leaf.longdesc) {
            for (const para of leaf.longdesc.split(/\n|\u2022/)) {
                const p = document.createElement('para');
                p.innerHTML = para;
                definition.appendChild(p);
            }
        }

    if (Object.hasOwn(leaf, 'subleafs')) {
        function subleaf_key(ecx) {
            if (ecx == "any") { return -2;
            } else if (ecx === undefined) { return -1;
            } else { return parseInt(ecx.replace("0x",""), 16);
            }
        }
        for (const subleaf of leaf.subleafs.toSorted((a,b) => subleaf_key(a.ECX) - subleaf_key(b.ECX))) {
            render_cpuid_subleaf(definition, subleaf);
        }
    } else {
        render_cpuid_output(definition, leaf);
    }
    return definition;
}

function render_register_number(reg) {
    if (Object.hasOwn(reg, 'EAX')) {
        return render_cpuid_label(reg.EAX, null, null);
    } else { // Assume it as an MSR
        let address = reg.address; // hex
        address = '0'.repeat(8-address.length) + address; // zero pad to length 8
        address = address.toUpperCase();
        return address + "H";
    }
}

function render_cpuid_label(eax, ecx, field) {
    eax = eax.replace(/0x(00){0,3}/, '').toUpperCase();
    let label = `CPUID.${eax}H`;

    if (ecx !== null && ecx != "any") {
        ecx = ecx.replace(/0x(00){0,3}/, '').toUpperCase();
        label += `.${ecx}H`;
    }

    if (field !== null) {
        // Note: typical field descriptions are EAX, EAX[0] or EAX.SHA512
        label += `:${field}`;
    }
    return label;
}

function render_cpuid_subleaf(definition, leaf) {
    let title = `${render_cpuid_label(leaf.EAX, leaf.ECX, null)}—${leaf.name}`;

    const details = document.createElement('details');
    details.className = "subleaf";
    definition.appendChild(details);

    const summary = document.createElement('summary');
    summary.innerHTML = title;
    details.appendChild(summary);

    if (leaf.shortdesc) {
        for (const para of leaf.shortdesc.split(/\n|\u2022/)) {
            const p = document.createElement('para');
            p.innerHTML = para;
            details.appendChild(p);
        }
    }

    if (leaf.longdesc) {
        for (const para of leaf.shortdesc.split(/\n|\u2022/)) {
            const p = document.createElement('para');
            p.innerHTML = para;
            details.appendChild(p);
        }
    }

    render_cpuid_output(details, leaf);
}

function render_cpuid_output(parent, leaf) {
    if (leaf.output) {
        const eax = mk_reg_spec(leaf.output.EAX);
        eax.name = "EAX";
        eax.size = 32;

        const ebx = mk_reg_spec(leaf.output.EBX);
        ebx.name = "EBX";
        ebx.size = 32;

        const ecx = mk_reg_spec(leaf.output.ECX);
        ecx.name = "ECX";
        ecx.size = 32;

        const edx = mk_reg_spec(leaf.output.EDX);
        edx.name = "EDX";
        edx.size = 32;

        parent.appendChild(render_reg_diagram(eax));
        parent.appendChild(document.createElement('br'));
        parent.appendChild(render_reg_fields(leaf.output.EAX, true));

        parent.appendChild(render_reg_diagram(ebx));
        parent.appendChild(document.createElement('br'));
        parent.appendChild(render_reg_fields(leaf.output.EBX, true));

        parent.appendChild(render_reg_diagram(ecx));
        parent.appendChild(document.createElement('br'));
        parent.appendChild(render_reg_fields(leaf.output.ECX, true));

        parent.appendChild(render_reg_diagram(edx));
        parent.appendChild(document.createElement('br'));
        parent.appendChild(render_reg_fields(leaf.output.EDX, true));
    }

    parent.appendChild(render_reg_fields(leaf, true));
}

function make_link(kind, filename, display_name) {
    filename = filename.replaceAll("/", "-");
    return `<a href="/${kind}/${filename}.html">${display_name}</a>`;
}

function make_menu_entry(kind, filename, display_name) {
    const id = `${kind}_entry_${filename}`;
    return `<li id='${id}' class='menu-entry'>${make_link(kind, filename, display_name)}</li>`;
}

function set_instruction_menu(menu, index) {
    for (const entry of index) {
        const name = entry[0];
        const display_name = name.replaceAll("/", "/<wbr>");
        const menu_entry = make_menu_entry('instruction', name, display_name);
        menu.insertAdjacentHTML("beforeend", menu_entry);
    };
}

function set_docbook_menu(menu, index) {
    for (const entry of index) {
        const filename = entry[1];
        const display_name = entry[0];
        const menu_entry = make_menu_entry('chapter', filename, display_name);
        menu.insertAdjacentHTML("beforeend", menu_entry);
    };
}

let definition_index = new Map();

function set_definition_menu(menu, definitions) {
    for (const definition of definitions.getElementsByTagName('definition')) {
        const name = definition.getAttribute('name');
        for (const dnm of definition.getElementsByTagName('defines')) {
            const nm = dnm.innerHTML
            const display_name = nm.replaceAll("_", "&shy;_");
            const menu_entry = make_menu_entry('definition', nm, display_name);
            menu.insertAdjacentHTML("beforeend", menu_entry);
            definition_index.set(nm, definition);
        }
    };
}

function set_category_menu(menu, index) {
    for (const entry of index) {
        const name = entry[0].replaceAll("/", "-");
        const display_name = entry[1];
        const menu_entry = make_menu_entry('category', name, display_name);
        menu.insertAdjacentHTML("beforeend", menu_entry);
    };
}

async function read_xml_file(url) {
    if (!url) {
        return;
    }
    const response = await fetch(url);
    const str = await response.text();
    const doc = await new DOMParser().parseFromString(str, "text/xml").documentElement;
    return doc;
}

async function read_compressed_xml_file(url) {
    if (!url) {
        return;
    }
    const response = await fetch(url);
    const blob = await response.blob();
    const decompressed = blob.stream().pipeThrough(new DecompressionStream("gzip"));
    const str = await new Response(decompressed).text();
    const doc = await new DOMParser().parseFromString(str, "text/xml").documentElement;
    return doc;
}

async function read_compressed_json_file(url) {
    const response = await fetch(url);
    if (!response.ok) {
        return null;
    }
    const blob = await response.blob();
    const decompressed = blob.stream().pipeThrough(new DecompressionStream("gzip"));
    const data = await new Response(decompressed).json();
    return data;
}

async function read_json_file(url) {
    const response = await fetch(url);
    if (!response.ok) {
        return null;
    }
    const data = await response.json();
    return data;
}

async function read_index(directory) {
    return await read_compressed_json_file(`${directory}/index.json.gz`);
}

let spec_directory = "/data";

let main_index = [];
(async () => {
    main_index = await read_index(spec_directory);
    make_instruction_highlighting_table2(main_index['instructions']);
    set_instruction_menu(document.getElementById("instruction_menu"), main_index['instructions']);
    set_docbook_menu(document.getElementById("docs_list"), main_index['chapters']);
    set_category_menu(document.getElementById("category_list"), main_index['categories']);
})();

async function load_definitions() {
    if (definition_index.size == 0) {
        const definitions = await read_compressed_xml_file(`${spec_directory}/definitions.xml.gz`);
        make_code_highlighting_table(definitions);
        set_definition_menu(document.getElementById("definition_list"), definitions);
    }
}

// Read instrinsics database
var intrinsics_index = [];
async function load_intrinsics() {
    if (intrinsics_index.length == 0) {
        intrinsics_index = await read_compressed_xml_file(`${spec_directory}/intrinsics.xml.gz`);
    }
}

let performance_index = {};
async function load_performance() {
    if (performance_index.length == 0) {
        performance_index = await read_compressed_json_file(`${spec_directory}/perf2.json.gz`) || {};
    }
}

function format_chip_name(s) {
    if (  s.includes('LAKE')
       || s.includes('FOREST')
       || s.includes('RAPIDS')
       || s.includes('MONT')
       || s.includes('RIDGE')
       || s.includes('AMD')
       || s.includes('SERVER')
       || s.includes('PENRYN')
       || s.includes('MEROM')
       || s.includes('NEHALEM')
       || s.includes('WESTMERE')
       || s.endsWith('ELL')
       ) {
        // Capitalize each word within the name
        let r = [];
        for (const word of s.split('_')) {
            if (word == 'AMD') {
                r.push(word);
            } else if (word.length > 0) {
                r.push(String(word).charAt(0).toUpperCase() + String(word).slice(1).toLowerCase());
            }
        }
        return r.join(" ");
    } else {
        return s.replace('PRESCOTT', ' Prescott').replace('PENTIUMPRO', 'PentiumPro').replace('PENTIUM', 'Pentium').replace('QUARK', 'Quark').replace('REAL','Real');
    }
}

// Amazingly, the best way to test whether an object is empty
// is to iterate over its (own) fields
function isEmptyObject(obj) {
    for (const i in obj) {
        return false;
    }
    return true;
}

let current_isa_sets = null;

let chips = {};
async function load_chips() {
    if (chips.length == 0) {
        chips = await read_json_file(`/chips.json`) || {};
        const chips_menu = document.getElementById("chip_list");
        let isa_sets = new Set([]);
        for (const [chip, cpuid_groups] of Object.entries(chips)) {
            for (const [cpuid, expansion] of Object.entries(cpuid_groups)) {
                isa_sets.add(cpuid);
                let ex = [];
                for (const [key, e] of Object.entries(expansion)) {
                    ex.push(...e);
                }
                cpuid_expansions[cpuid] = ex;
            }
            let id = 'chip_' + chip;
            let select = 'select_chip_' + chip;
            let display_name = format_chip_name(chip);
            // const input = `<button class='menu-entry'>${display_name}</button>`;
            const input = `<input type='radio' id='${select}' name='chip'/><label for='${select}' class='menu_entry'>${display_name}</label>`;
            const menu_entry = `<li id=${id} onclick="set_chip_filter('${chip}')">${input}</li>`;
            chips_menu.insertAdjacentHTML("afterbegin", menu_entry);
        }
        current_isa_sets = isa_sets;
        if (! isEmptyObject(chips)) {
            // Iterate up stack marking all parents as visible
            for (let node = chips_menu; node; node = node.parentNode) {
                if (node.style && node.style.display == 'none') {
                    node.style.display = 'block';
                }
            }
        }
    }
}

async function load_all_data() {
    await Promise.all([
        load_definitions(),
        load_chips(),
    ]);
}

function set_chip_filter(chip) {
    const cpuid_groups = chips[chip];
    console.log(`Selecting chip ${chip} with cpuid groups ${cpuid_groups}`);
    current_isa_sets = new Set(Object.getOwnPropertyNames(cpuid_groups));
    update_filter(main_index);
}

function toggle_cpuid_view(event) {
    const group = event.target.getAttribute('cpuid_group');
    console.log(`Toggling ${group}`, current_isa_sets);
    if (current_isa_sets) {
        if (event.target.checked) {
            current_isa_sets.add(group);
        } else {
            current_isa_sets.delete(group);
        }
    }
    update_filter(main_index);
}


function update_filter(index1) {
    const index = index1['instructions'];
    for (const entry of index) {
        const isa_set = entry[4];
        const match = isa_set === null || current_isa_sets === null || isa_set.some((isa) => current_isa_sets.has(isa));
        const name = entry[0];
        const id = 'instruction_entry_' + name;
        const menu_entry = document.getElementById(id);
        menu_entry.style.display = match ? 'block' : 'none';
    }
}

function filter_iforms(iform_groups) {
    let rss = [];
    for (const group of iform_groups) {
        let rs = [];
        const iforms = group.getElementsByTagName('iform');
        for (const iform of iforms) {
            const cpuid_groups = Array.from(iform.getElementsByTagName('cpuid-group'));
            const selected = cpuid_groups.length == 0 || cpuid_groups.some((grp) => current_isa_sets == null || current_isa_sets.has(grp.getAttribute('name')));
            if (selected) {
                rs.push(iform);
            }
        }
        if (rs.length > 0) {
            rss.push(rs);
        }
    }
    return rss;
}

// Read CPUID and MSR databases
let cpuids = [];
let msrs = [];

// Load File of registers (if not already loaded)
async function load_register_file(filename, kind, menu_by_name, menu_by_number) {
    const regs = await read_json_file(filename) || [];

    let name_entries = [];
    let number_entries = [];
    for (const reg of regs) {
        const name = reg.name;
        const filename = kind == "cpuid" ? reg.EAX : name;
        const display_name = name.replaceAll("_", "&shy;_"); // enable line breaks in long names
        const number = render_register_number(reg);
        const display_number = `${number} &mdash; ${name}`;

        name_entries.push([name, make_menu_entry(kind, filename, display_name)]);
        number_entries.push([number, make_menu_entry(kind, filename, display_number)]);

        // on hover, display the register longdesc
        const longdesc = document.createElement('para');
        longdesc.textContent = reg.longdesc;
        definition_links[name] = make_code_ref(name, name, 'Register', kind, null, [longdesc]);
    }

    add_menu_entries(menu_by_name, name_entries);
    add_menu_entries(menu_by_number, number_entries);
    return regs;
}

// Use this to sort arrays of strings
function compare_string(a, b) {
    return (a > b) ? 1 : ((b > a) ? -1 : 0);
}

// Sort menu entries by their first element and add the second element to parent
function add_menu_entries(parent, entries) {
    // Sort the entries and build menu entries
    for (const [_, entry] of entries.toSorted((a, b) => compare_string(a[0], b[0]))) {
        parent.insertAdjacentHTML("beforeend", entry);
    }
}

// Add links to CPUID fields and CPUID field menu
function add_cpuid_fields(menu, regs) {
    let fieldss = [];
    for (const reg of regs) {
        // CPUID fields
        for (const subleaf of reg.subleafs ?? []) {
            if (subleaf.output) {
                for (const key in subleaf.output) {
                    const output = subleaf.output[key];
                    if (output.fields) {
                        fieldss.push([reg, subleaf.EAX, subleaf.ECX, key, Array.from(output.fields.values())]);
                    }
                }
            }
        }

        if (reg.output) {
            for (const key in reg.output) {
                const output = reg.output[key];
                if (output.fields) {
                    fieldss.push([reg, reg.EAX, reg.ECX, key, Array.from(output.fields.values())]);
                }
            }
        }
    }

    let entries = [];
    for (const [reg, eax, ecx, key, fields] of fieldss) {
        for (const field of fields) {
            if (field.name && field.name != "Reserved") {
                const reg_name = reg.name;
                const filename = reg.EAX;
                const field_name = `CPUID_${field.name}`;
                const display_name = field_name.replaceAll("_", "&shy;_"); // enable line breaks in long names
                const longdesc = document.createElement('longdesc');
                longdesc.innerHTML = `${render_cpuid_label(eax, ecx, key+"."+field.name)} &mdash; ${field.longdesc}`;
                definition_links[field_name] = make_code_ref(reg_name, field_name, 'Register', 'reg', null, [longdesc]);

                const screen = 0;
                entries.push([field_name, make_menu_entry('cpuid', filename, display_name)]);
            }
        }
    }
    add_menu_entries(menu, entries); // menu of CPUID fields
}

async function load_registers() {
    const msr_list_by_name = document.getElementById("msr_list_by_name");
    const msr_list_by_number = document.getElementById("msr_list_by_number");
    if (msrs.length == 0) {
        msrs = await load_register_file(`${spec_directory}/msrs.json`, 'msr', msr_list_by_name, msr_list_by_number);
    }
    msr_list_by_name.parentNode.style.display = msrs.length == 0 ? 'none' : 'block';
    msr_list_by_number.parentNode.style.display = msrs.length == 0 ? 'none' : 'block';

    const cpuid_list_by_name = document.getElementById("cpuid_list_by_name");
    const cpuid_list_by_number = document.getElementById("cpuid_list_by_number");
    const cpuid_list_fields = document.getElementById("cpuid_list_fields");
    if (cpuids.length == 0) {
        cpuids = await load_register_file(`${spec_directory}/cpuid.json`, 'cpuid', cpuid_list_by_name, cpuid_list_by_number);
        add_cpuid_fields(cpuid_list_fields, cpuids);
    }
    cpuid_list_by_name.parentNode.style.display = cpuids.length == 0 ? 'none' : 'block';
    cpuid_list_by_number.parentNode.style.display = cpuids.length == 0 ? 'none' : 'block';
    cpuid_list_fields.parentNode.style.display = cpuids.length == 0 ? 'none' : 'block';
}

(load_registers)();

function find_intrinsics(intrinsics_idx, xed_names) {
    let rs = [];
    for (const intrinsic of intrinsics_idx.getElementsByTagName('intrinsic')) {
        for (const instruction of intrinsic.getElementsByTagName('instruction')) {
            if (xed_names.includes(instruction.getAttribute('xed'))) {
                rs.push(intrinsic);
            }
        }
    }
    return rs;
}

const output0 = document.getElementById("iaspec1");
const output1 = document.getElementById("iaspec2");
const outputs = [output0, output1];

async function toggle_visibility(event, id) {
    const thing = document.getElementById(id);
    if (thing) {
        if (event.target.checked) {
            thing.style.display = "block";
        } else {
            thing.style.display = "none";
        }
    }
}

async function toggle_class_visibility(event, cls) {
    for (const thing of document.getElementsByClassName(cls)) {
        if (event.target.checked) {
            thing.style.display = "block";
        } else {
            thing.style.display = "none";
        }
    }
}

// To make it easier to find changes in pages that use
// '<details>' to hide subsections, go up the hierarchy
// marking everything above.
function mark_different(p) {
    while (p) {
        if (p.tagName == 'DETAILS') {
            if (p.open) {
                p.style.borderLeftStyle = 'none';
            } else {
                // Note that we change the text color not the background color - to
                // distinguish from a change in the summary itself.
                // (todo: but what if there is a change in the summary and in a child node?)
                p.style.borderLeftStyle = 'solid';
                p.style.borderColor = color_change;
            }
        }
        p = p.parentElement;
    }
}

function diff_aux(xs, ys, add_color, del_color, change_color) {
    for( const [u, p] of xs ) {
        if (ys.has(u)) {
            const q = ys.get(u);
            if (p.innerHTML != q.innerHTML) {
                const cps = p.children;
                const cqs = q.children;
                for(let i = 0; i < cps.length; i++) {
                    const cp = cps[i];
                    if (i >= cqs.length) {
                        cp.style.backgroundColor = add_color;
                    } else if (cp != cqs[i]) {
                        cp.style.backgroundColor = change_color;
                    }
                }
                p.style.backgroundColor = change_color;
                mark_different(p);
                mark_different(q);
            }
        } else {
            p.style.backgroundColor = add_color;
            mark_different(p);
        }
    }
}

const color_insert = 'green';
const color_delete = 'red';
const color_change = 'darkorchid';

function diff_html(x, y) {
    let xs = new Map();
    for(const p of x.getElementsByTagName('para')) { xs.set(p.getAttribute('unique'), p); }
    let ys = new Map();
    for(const p of y.getElementsByTagName('para')) { ys.set(p.getAttribute('unique'), p); }

    diff_aux(xs, ys, color_insert, color_delete, color_change);
    diff_aux(ys, xs, color_delete, color_insert, color_change);
}

function render_definition_table(heading, pairs) {
    let s = "";
    if (pairs.length != 0) {
        s = s + heading;
        s = s + `<table class='definition-table'>`;
        s = s + `<tbody>`;
        for (const [label, definition] of pairs) {
            s = s + `<tr>`;
            s = s + `<th>${label}</th>`;
            s = s + `<td>${definition}</td>`;
            s = s + `</tr>`;
        }
        s = s + `</tbody>`;
        s = s + `</table>`;
    }
    return s;
}

async function patch_page() {
    await load_all_data();
    for (const x of Array.from(document.getElementsByTagName('sdm_entry'))) {
        let kind = x.getAttribute('kind');
        if (kind == "category") {
            let textfile = x.getAttribute('file');
            const text = await read_xml_file(textfile);
            x.innerHTML = render_category(main_index, text);

        } else if (kind == "chapter") {
            let textfile = x.getAttribute('file');
            let what = 'docbook';
            const text = await read_xml_file(textfile);
            x.replaceWith(patch_docbook(text, what == 'docbook'));

        } else if (kind == "definition") {
            let name = x.getAttribute('name');
            const definition = definition_index.get(name);
            x.innerHTML = render_definition(definition);

        } else if (kind == "instruction") {
            let textfile = x.getAttribute('sdm_file');
            let datafile = x.getAttribute('data_file');
            const [text, data, _i, _p] = await Promise.all([
                read_xml_file(textfile),
                read_xml_file(datafile),
                load_intrinsics(),
                load_performance(),
            ]);
            x.innerHTML = render_instruction(intrinsics_index, performance_index, text, data);

        } else if (kind == "msr") {
            let name = x.getAttribute('name');
            await load_registers();
            for (const reg of msrs) {
                if (reg.name === name) {
                    x.replaceWith(render_reg(reg));
                }
            }
        } else if (kind == "cpuid") {
            let leaf = x.getAttribute('leaf');
            await load_registers();
            for (const reg of cpuids) {
                if (reg.EAX === leaf) {
                    x.replaceWith(render_cpuid(reg));
                }
            }
        }
    }
}
(patch_page)();

// Adapt whether menu/sidebar is active based on screen width
function adapt_width(narrow) {
    const top = document.getElementById("select_menu_parent");
    const top_details = document.getElementById("select_menu_details");
    const side = document.getElementById("side_menu_parent");
    const menu = document.getElementById("select_menu");
    if (narrow.matches) {
        top_details.append(menu);
        top.style.display = "block";
        side.style.display = "none";
        menu.style.display = "";
    } else {
        side.append(menu);
        side.style.display = "block";
        top.style.display = "none";
        menu.style.display = "block";
    }
}

{
    var narrow_screen = window.matchMedia("(max-width: 70rem)");
    adapt_width(narrow_screen);
    narrow_screen.addEventListener("change", function() { adapt_width(narrow_screen); });
}


////////////////////////////////////////////////////////////////
// Search
////////////////////////////////////////////////////////////////

function filter_menus(search) {
    const index_menu = document.getElementById("select_menu");
    if (search == "") { // reset search, close all but one sub-menu
        let first = true;
        for(const submenu of index_menu.children) {
            if (submenu.tagName == 'DETAILS') {
                submenu.open = first;
                submenu.setAttribute('name', 'page_menu');
                first = false;
                for(const menu of submenu.children) {
                    for(const entry of menu.children) {
                        entry.style.display = "block";
                    }
                }
            }
        }
    } else { // filter all menus by search, open all menus
        search = search.toUpperCase();
        console.log("Searching for", search);
        for(const submenu of index_menu.children) {
            if (submenu.tagName == 'DETAILS') {
                submenu.removeAttribute('name');
                submenu.open = true;
                for(const menu of submenu.children) {
                    for(const entry of menu.children) {
                        const text = entry.children[0].innerHTML.toUpperCase();
                        const match = text.includes(search);
                        entry.style.display = match ? "block" : "none";
                    }
                }
            }
        }
    }
}

async function init_search() {
    const search_box = document.getElementById("sdm_search");
    search_box.addEventListener("input", (event) => {
        filter_menus(search_box.value);
    })
}

(init_search)();

////////////////////////////////////////////////////////////////
// End
////////////////////////////////////////////////////////////////
