// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import * as child_process from 'child_process';
import * as fsExtra from 'fs-extra';

import subFn = require('./sub');
import CtrlInfo = require('./CtrlInfo');
let self_ctrl_info = new CtrlInfo.CtrlInfo();

const env = process.env; // 環境変数からtmpフォルダを求める
const output_dir = (env.Tmp ? path.join(env.Tmp, "DoxygenViewer") : "");


// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext)
{
    console.log('Congratulations, your extension "DoxygenPreviewer" is now active!');
    console.log(context.extensionPath);

    let html_obj = doxygen_exec(context.extensionPath);

    const insert_script_dir = path.join(context.extensionPath, "script", "insert_script");
    const insert_script_uri = vscode.Uri.file(path.join(insert_script_dir, "message.js"));    
    const insert_script_str = insert_script_uri.with({ scheme: 'vscode-resource' }).toString(true);
    const css_path = vscode.Uri.file( path.join(output_dir, 'html', 'doxygen.css') );
    const css_src  = css_path.with({ scheme: 'vscode-resource' }).toString(true);

    // 本当はhtml_nameが空文字だったらパネルを開きたくないが、ここで止めると拡張機能が有効に
    // ならないので止めない。影響としては真っ黒なパネルが開くぐらいっぽいので気にしなくてもいいことにする。
    let isFirst = true;
    const resource_root = [
        vscode.Uri.file(output_dir),
        vscode.Uri.file(insert_script_dir),
    ];
    let panel_obj: vscode.WebviewPanel;

    // The command has been defined in the package.json file
    // Now provide the implementation of the command with registerCommand
    // The commandId parameter must match the command field in package.json
    let disposable = vscode.commands.registerCommand('extension.DoxygenPreviewer', () => {
        // Display a message box to the user
        //vscode.window.showInformationMessage('Hello World!');
        if (!isFirst) {
            html_obj = doxygen_exec(context.extensionPath);
        }
        isFirst = false;
        console.log("html_name = " + html_obj.load);
        if (html_obj.load == "") {
            return;
        } 

        if (!self_ctrl_info.panel.panel_alive) {
            panel_obj = vscode.window.createWebviewPanel(
                "doxy", 
                "doxygen browser", 
                vscode.ViewColumn.Beside, 
                {
                    enableScripts: true,
                    enableFindWidget: true,
                    localResourceRoots: resource_root,
                }
            );
            panel_obj.onDidDispose( () => {
                console.log("onDidDispose");
                self_ctrl_info.panel.panel_alive = false;
            });
            panel_obj.webview.onDidReceiveMessage( (ev) => {
                if (!ev.data) {
                    return;
                }
                const data = ev.data;
                switch (ev.command) {
                  case "link":
                    next_html_load(data, panel_obj, css_src, insert_script_str);
                  case "scroll":
                    console.log(ev.data);
                    self_ctrl_info.panel.scrolltop = ev.data;
                  case "notice":
                    first_position_request(panel_obj, self_ctrl_info.panel.scrolltop);
                }
            });
            self_ctrl_info.panel.panel_alive = true;
        }

        html_str_load(html_obj, panel_obj, css_src, insert_script_str);
    });

    context.subscriptions.push(disposable);
}

function first_position_request(panel_obj: vscode.WebviewPanel, scrolltop: number)
{
    if (self_ctrl_info.panel.current == self_ctrl_info.panel.previous) {
        const obj = {
            command: "scroll",
            data:    scrolltop,
        }
        panel_obj.webview.postMessage(obj);
    }
}

function html_str_load(html_obj: {load: string, original: string}, 
                       panel_obj: vscode.WebviewPanel, 
                       css_src: string, 
                       insert_script_str: string)
{
    if (!html_obj.load || !html_obj.original) {
        return;
    }
    self_ctrl_info.panel.previous = self_ctrl_info.panel.current;
    self_ctrl_info.panel.current = html_obj.original;
    console.log("current : " + self_ctrl_info.panel.current);
    vscode.workspace.openTextDocument(html_obj.load).then(doc=> {
        console.log("set html doc");
        panel_obj.webview.html = html_string_get(doc, css_src, insert_script_str);
    });
}

function next_html_load(link_data: string, 
                       panel_obj: vscode.WebviewPanel, 
                       css_src: string, 
                       insert_script_str: string)
{
    //const scrl_pos = link_data.replace(/^.+@/, "");
    link_data = link_data.replace("file:\/\/\/", "").replace(/#.+/, "").replace(/@.+/, "");
    const html_name = path.join(output_dir, "html", link_data);
    console.log("next : " + html_name);
    if (self_ctrl_info.panel.current == html_name) {
        return;
    }
    const obj = {load: html_name, original: html_name};
    html_str_load(obj, panel_obj, css_src, insert_script_str);
    self_ctrl_info.panel.scrolltop = 0;
}

function html_string_get(doc: vscode.TextDocument, css_src: string, insert_script_str: string) {
    const buf = doc.getText().toString();
    let line_strs = buf.split(/\r\n|\n/);

    const css_link_tag = "<link href=\"" + css_src +"\" rel=\"stylesheet\" type=\"text/css\" />";
    //console.log("cssSrc = " + css_link_tag);
    line_strs.splice(15, 0, css_link_tag); // 15行目にcssの指定があるのでそれに合わせる。
    const script_tag = `<script type="text/javascript" src="${insert_script_str}"></script>`;
    line_strs.splice(13, 0, script_tag);

    let line_strs2 = line_strs.map( (fn) => {
        if (fn.includes("<title>")) {
            const title_rnd = Math.floor(Math.random() * 1000);
            return "<title>" + title_rnd + "</title>"
        } else if (fn.includes("href=") && !fn.includes("css")) {
            return fn.replace(/href=\"/g, "href=\"file:\/\/\/"); // よくわからんがこれがないとリンクを移動しようとする
        } else {
            return fn;
        }
    });
    return line_strs2.join("");
}

function doxygen_exec(current_path: string)
{
    var ret_obj = {load: "", original: ""};
    const callback = () => {
        ret_obj = doxygen_exec_main(current_path); 
    };
    console.log("tmp = " + output_dir.toString());
    if (output_dir == "") {
        return ret_obj;
    }
    try {
        if (fs.existsSync(output_dir)) {
            //fs.rmdir(output_dir, () => { fs.mkdir(output_dir, callback); } );
            fsExtra.removeSync(output_dir);
            fs.mkdirSync(output_dir);
            callback();
        } else {
            fs.mkdirSync(output_dir);
            callback();
        }
    } catch(e) {
        console.log("!! fs err : " + e);
        const err_msg = e.toString();
        if (err_msg.includes("Command failed")) {
            vscode.window.showErrorMessage('Sorry something was happend. Your system is x86?');
        } else {
            vscode.window.showErrorMessage('Please close %Temp% directory');
        }
    }

    return ret_obj;
}

function doxygen_exec_main(current_path: string)
{
    let ret_obj = {load: "", original: ""}
    let editor = vscode.window.activeTextEditor;
    if (!editor) { // これがないと警告される
        return ret_obj;
    }
    let working_file_path = editor.document.fileName;

    const working_file_name = subFn.src_name_of_workspace_get(working_file_path);
    if (working_file_name == "") {
        return ret_obj;
    }
    const dst_path = path.join(output_dir, working_file_name);
    console.log('target path = ' + dst_path);

    fs.copyFileSync(working_file_path, dst_path);
    const doxyapp_path = path.join(current_path, "bin", "doxyapp.exe");
    child_process.execSync(doxyapp_path + " " + dst_path);

    const html_dir = path.join(output_dir, "html");
    const file_list = fs.readdirSync(html_dir);
    const src_file_name = subFn.camel_to_snake(working_file_name.split(".")[0]);
    let html_name = "";
    let original_name = "";
    console.log("src_file_name = " + src_file_name);
    if (!file_list) {
        return ret_obj;
    }
    file_list.forEach(
        function(fn) {
            if (fn.includes(src_file_name) && !fn.includes("_source")) {
                original_name = path.join(html_dir, fn).toString();
                const rndn = Math.floor(Math.random() * 1000);
                const fn_rnd = rndn.toString() + ".html";
                html_name = path.join(html_dir, fn_rnd).toString();
                fs.copyFileSync(original_name, html_name); // ファイル名が同じだとロードしてくれないので
                return;
            }
        }
    );

    ret_obj.load     = html_name;
    ret_obj.original = original_name;
    return ret_obj;
}

// this method is called when your extension is deactivated
export function deactivate() {}
