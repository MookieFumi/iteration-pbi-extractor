registerNS('app');

app.vsoService = (function() {
    var config = {
        url: {
            project: 'https://analyticalways.visualstudio.com/DefaultCollection/_apis/projects?api-version=2.0',
            iteration: 'https://analyticalways.visualstudio.com/DefaultCollection/{0}/_apis/work/teamsettings/iterations?api-version=2.0',
            workItemsInIteration: 'https://analyticalways.visualstudio.com/DefaultCollection/{0}/_apis/wit/wiql?api-version=2.0',
            workItemsDetail: 'https://analyticalways.visualstudio.com/DefaultCollection/_apis/wit/workitems?api-version=2.0'
        }
    };

    function getAuthorizationHeader(userName, password) {
        return window.btoa(userName + ":" + password);
    };

    function showError(textStatus, error) {
        var err = textStatus + ", " + error;
        Materialize.toast('There was a problem retrieving data', 1500, 'rounded');
    }

    var getProjects = function(userName, password) {
        var header = getAuthorizationHeader(userName, password);
        return app.ajax.get(config.url.project, header)
            .fail(function(jqxhr, textStatus, error) {
                showError(textStatus, error);
            });
    };

    var getIterations = function(project, userName, password) {
        var header = getAuthorizationHeader(userName, password);
        return app.ajax.get(config.url.iteration.replace('{0}', project), header)
            .fail(function(jqxhr, textStatus, error) {
                showError(textStatus, error);
            });
    };

    var getWorkItems = function(project, path, userName, password) {
        var data = JSON.stringify({
            "query": "SELECT * FROM WorkItems WHERE [System.TeamProject] = '" + project + "' AND ([System.WorkItemType] = 'Product Backlog Item' OR [System.WorkItemType] = 'Bug') AND [System.IterationPath] = '" + path + "'"
        });
        var url = config.url.workItemsInIteration.replace('{0}', project);
        var header = getAuthorizationHeader(userName, password);

        return $.when(app.ajax.post(url, header, data)
            .fail(function(jqxhr, textStatus, error) {
                showError(textStatus, error);
            })).then(function(data, textStatus, jqXHR) {
            var url = config.url.workItemsDetail + '&ids=' + _.pluck(data.workItems, 'id');
            return app.ajax.get(url, header)
                .fail(function(jqxhr, textStatus, error) {
                    showError(textStatus, error);
                });
        });
    };

    return {
        getProjects: getProjects,
        getIterations: getIterations,
        getWorkItems: getWorkItems
    }
})(window);
