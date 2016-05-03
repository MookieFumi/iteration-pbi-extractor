registerNS('app');

//reveal module pattern
app.ajax = (function() {
    function get(url) {
        var options = {
            type: "GET",
            url: url
        };
        return $.ajax(options);
    };

    function post(url, data) {
        return $.ajax({
            type: "POST",
            contentType: "application/json",
            url: url,
            data: data
        });
    };

    function beforeSend(xhr, authorization) {
        xhr.setRequestHeader("Authorization", "Basic " + authorization);
        
        $(document).ajaxStart($.blockUI({
            message: null
        })).ajaxStop($.unblockUI);
    };

    return {
        get: get,
        post: post,
        beforeSend: beforeSend
    }
})();
