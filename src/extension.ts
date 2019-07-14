// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import * as child_process from 'child_process';
import * as fsExtra from 'fs-extra';

const env = process.env; // 環境変数からtmpフォルダを求める
const output_dir = (env.Tmp ? path.join(env.Tmp, "DoxygenViewer") : "");
var panel_alive = false;

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext)
{
    console.log('Congratulations, your extension "DoxygenPreviewer" is now active!');
    console.log(context.extensionPath);

    vscode.window.onDidChangeVisibleTextEditors(
        () => {
            //console.log("fire");
            //html_name = doxygen_exec(context.extensionPath);
        }
    );
    let html_name = doxygen_exec(context.extensionPath);
    // 本当はhtml_nameが空文字だったらパネルを開きたくないが、ここで止めると拡張機能が有効に
    // ならないので止めない。影響としては真っ黒なパネルが開くぐらいっぽいので気にしなくてもいいことにする。
    let isFirst = true;
    const resource_root = [
        vscode.Uri.file(output_dir),
    ];
    let panel_obj = vscode.window.createWebviewPanel(
        "doxy", 
        "doxygen browser", 
        vscode.ViewColumn.Beside, 
        {
            enableScripts: true,
            enableFindWidget: true,
            localResourceRoots: resource_root,
        }
    );
    panel_alive = true;
    panel_obj.onDidDispose( () => {
        console.log("onDidDispose");
        panel_alive = false;
    });

    // Use the console to output diagnostic information (console.log) and errors (console.error)
    // This line of code will only be executed once when your extension is activated

    // The command has been defined in the package.json file
    // Now provide the implementation of the command with registerCommand
    // The commandId parameter must match the command field in package.json
    let disposable = vscode.commands.registerCommand('extension.DoxygenPreviewer', () => {
        // Display a message box to the user
        //vscode.window.showInformationMessage('Hello World!');
        if (!isFirst) {
            html_name = doxygen_exec(context.extensionPath);
        }
        isFirst = false;
        console.log("html_name = " + html_name);
        if (html_name == "") {
            return;
        } 

        // And get the special URI to use with the webview
        const css_path = vscode.Uri.file( path.join(output_dir, 'html', 'doxygen.css') );
        const cssSrc = css_path.with({ scheme: 'vscode-resource' }).toString(true);
        if (!panel_alive) {
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
            panel_alive = true;
            panel_obj.onDidDispose( () => {
                console.log("onDidDispose");
                panel_alive = false;
            });
        } else {
            panel_obj.webview.html = "";
        }
        vscode.workspace.openTextDocument(html_name).then(doc=> {
            console.log("set html doc");
            panel_obj.webview.html = html_string_get(doc, cssSrc);
        }); 
    });

    context.subscriptions.push(disposable);
}

function html_string_get(doc: vscode.TextDocument, cssSrc : String) {
    const css_link_tag = "<link href=\"" + cssSrc +"\" rel=\"stylesheet\" type=\"text/css\" />";
    console.log("cssSrc = " + css_link_tag);
    const buf = doc.getText().toString();
    let line_strs = buf.split(/\r\n|\n/);
    line_strs.splice(15, 0, css_link_tag); // 15行目にcssの指定があるのでそれに合わせる。

    let line_strs2 = line_strs.map( (fn) => {
        if (fn.includes("<title>")) {
            const title_rnd = Math.floor(Math.random() * 1000);
            return "<title>" + title_rnd + "</title>"
        } else {
            return fn;
        }
    });
    return line_strs2.join("");
}

function src_name_of_workspace_get(path: String)
{
    const fn = path.split(/\\|\//).slice(-1)[0];
    console.log("get_src_name_of_workspace : " + fn);
    var ret_str = "";
    if (fn.match(/\.c$|\.h$|\.cpp$|\.hpp$/)) {
        ret_str = fn;
    }
    return ret_str;
}

function doxygen_exec(current_path: string)
{
    var ret_str = "";
    const callback = () => { ret_str = doxygen_exec_main(current_path); };
    console.log("tmp = " + output_dir.toString());
    if (output_dir == "") {
        return ret_str;
    }
    if (fs.existsSync(output_dir)) {
        //fs.rmdir(output_dir, () => { fs.mkdir(output_dir, callback); } );
        fsExtra.removeSync(output_dir);
        fs.mkdirSync(output_dir);
        callback();
    } else {
        fs.mkdirSync(output_dir);
        callback();
    }
    return ret_str;
}

function doxygen_exec_main(current_path: string)
{
    let editor = vscode.window.activeTextEditor;
    if (!editor) { // これがないと警告される
        return "";
    }
    let working_file_path = editor.document.fileName;

    const working_file_name = src_name_of_workspace_get(working_file_path);
    if (working_file_name == "") {
        return "";
    }
    const dst_path = path.join(output_dir, working_file_name);
    console.log('target path = ' + dst_path);

    fs.copyFileSync(working_file_path, dst_path);
    const doxyapp_path = path.join(current_path, "bin", "doxyapp.exe");
    child_process.execSync(doxyapp_path + " " + dst_path);

    const html_dir = path.join(output_dir, "html");
    const file_list = fs.readdirSync(html_dir);
    const src_file_name = camel_to_snake(working_file_name.split(".")[0]);
    let html_name = "";
    console.log("src_file_name = " + src_file_name);
    if (!file_list) {
        return "";
    }
    file_list.forEach(
        function(fn) {
            if (fn.includes(src_file_name) && !fn.includes("_source")) {
                const original_html_name = path.join(html_dir, fn).toString();
                const rndn = Math.floor(Math.random() * 1000);
                const fn_rnd = rndn.toString() + ".html";
                html_name = path.join(html_dir, fn_rnd).toString();
                fs.copyFileSync(original_html_name, html_name); // ファイル名が同じだとロードしてくれないので
                return;
            }
        }
    );

    return html_name;
}

// https://qiita.com/thelarch/items/cc4707e1c7ef0d73ba73
var camel_to_snake = function(p: string){
    //大文字を_+小文字にする(例:A を _a)
    return p.replace(/([A-Z])/g,
        function(s) {
            return '_' + s.charAt(0).toLowerCase();
        }
    );
};

// this method is called when your extension is deactivated
export function deactivate() {}
