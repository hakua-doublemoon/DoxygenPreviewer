const vscode = acquireVsCodeApi();
function vscode_post_msg(command, data)
{
    obj = {
        command: command,
        data:    data,
    }
    vscode.postMessage(obj);
}   

var counter = 0;
function count_test()
{
    counter = counter + 1;
    //console.log(i);
    //vscode_post_msg("test", i);
}
setInterval("count_test()",1000);

function link_message(href_str)
{
    //console.log("link_message <= " + href_str);
    const line_id = href_str.replace(/^.+#/, "");
    if (line_id.length > 2) {
        var elm = document.getElementById(line_id);
        if (elm) {
            elm.scrollIntoView();
        }    
    }
    //console.log("link_message <= " + href_str);
    //vscode_post_msg("link", href_str + "@" + scrl_pos);
    vscode_post_msg("link", href_str);
}

window.onload = () => {
    var a_tags = document.getElementsByTagName("a");
    console.log("number of a = " + a_tags.length);
    window.scrollTo(0,0);
    for (var i = 0; i < a_tags.length; i+=1)
    {   
        var element = a_tags.item(i);
        //console.log(element);
        if (!element.className === "el") {
            continue;
        }
        if (element.href.length < 5 || element.href.includes("http")) {
            continue;
        }
        const href_str = element.href;
        //const position = element.getBoundingClientRect();
        //const scrl_pos = position.top;
        //console.log(href_str);
        element.addEventListener('click',
            () => {
                link_message(href_str);
                //console.log(element);
            }
        )
    }
    vscode_post_msg("notice", "load completed");
}

// https://naruhodo.repop.jp/javascript-scroll-event/
// スクロールをトリガーにしたイベント
window.addEventListener('scroll', () => {
    //高さを取得して表示
    let scrollTop = document.scrollingElement.scrollTop;
  　vscode_post_msg("scroll",  scrollTop);
}, false);

window.addEventListener('message', event => {
    console.log(event);
    const message = event.data; // The JSON data our extension sent
    switch (message.command) {
      case 'scroll':
        console.log("scroll to : " + message.data);
        window.scrollTo(0,message.data);
        break;
    }
});
