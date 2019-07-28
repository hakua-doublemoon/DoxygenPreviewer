export function src_name_of_workspace_get(path: String)
{
    const fn = path.split(/\\|\//).slice(-1)[0];
    console.log("get_src_name_of_workspace : " + fn);
    var ret_str = "";
    if (fn.match(/\.c$|\.h$|\.cpp$|\.hpp$/)) {
        ret_str = fn;
    }
    return ret_str;
}

// https://qiita.com/thelarch/items/cc4707e1c7ef0d73ba73
export function camel_to_snake(p: string)
{
    //大文字を_+小文字にする(例:A を _a)
    return p.replace(/([A-Z])/g,
        function(s) {
            return '_' + s.charAt(0).toLowerCase();
        }
    );
}
