registerNS('app');

app.ajax = (function() {

    var beforeSend = function(xhr, authorization) {
        xhr.setRequestHeader("Authorization", "Basic " + authorization);
        $(document).ajaxStart($.blockUI({
            message: null
        })).ajaxStop($.unblockUI);
    };

    var get = function(url, authorization) {
        var options = {
            type: "GET",
            url: url,
            beforeSend: function(xhr) {
                beforeSend(xhr, authorization);
            }
        };
        return $.ajax(options);
    };

    var post = function(url, authorization, data) {
        return $.ajax({
            type: "POST",
            contentType: "application/json",
            url: url,
            data: data,
            beforeSend: function(xhr) {
                beforeSend(xhr, authorization);
            }
        });
    };

    return {
        get: get,
        post: post
    }
})();
