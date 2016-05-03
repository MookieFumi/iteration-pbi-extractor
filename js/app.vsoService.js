registerNS('app');

app.vsoService = (function() {

    var config = (function() {
        var baseUrl = 'https://analyticalways.visualstudio.com/DefaultCollection/';
        var version = 'api-version=2.0';
        return {
            getProjectsUrl: function() {
                return baseUrl + '_apis/projects?' + version;
            },
            getIterationsUrl: function(project) {
                return baseUrl + project + '/_apis/work/teamsettings/iterations?' + version;
            },
            getWorkItemsInIterarionUrl: function(iterarion) {
                return baseUrl + iterarion + '/_apis/wit/wiql?' + version;
            },
            getWorkItemsDetailUrl: function() {
                return baseUrl + '_apis/wit/workitems?' + version;
            }
        };
    })();

    function showError(textStatus, error) {
        var err = textStatus + ", " + error;
        Materialize.toast('There was a problem retrieving data', 1500, 'rounded');
    }

    function getProjects(userName, password) {
        var url = config.getProjectsUrl();
        return app.ajax.get(url)
            .fail(function(jqxhr, textStatus, error) {
                showError(textStatus, error);
            });
    };

    function getIterations(project) {
        var url = config.getIterationsUrl(project);
        return app.ajax.get(url)
            .fail(function(jqxhr, textStatus, error) {
                showError(textStatus, error);
            });
    };

    function getWorkItems(project, path) {
        var data = JSON.stringify({
            "query": "SELECT * FROM WorkItems " +
                "WHERE [System.TeamProject] = '" + project + "' " +
                "AND ([System.WorkItemType] = 'Product Backlog Item' " +
                "OR [System.WorkItemType] = 'Bug') " +
                "AND [System.IterationPath] = '" + path + "'"
        });

        var url = config.getWorkItemsInIterarionUrl(project);
        return $.when(getWorkItemsInIterarion(url, data)).then(getWorkItemsDetail);
    };

    function getWorkItemsInIterarion(url, data) {
        return app.ajax.post(url, data).fail(function(jqxhr, textStatus, error) {
            showError(textStatus, error);
        })
    }

    function getWorkItemsDetail(result, textStatus, jqXHR) {
        var url = config.getWorkItemsDetailUrl() + '&ids=' + _.pluck(result.workItems, 'id');
        return app.ajax.get(url)
            .fail(function(jqxhr, textStatus, error) {
                showError(textStatus, error);
            });
    }

    return {
        getProjects: getProjects,
        getIterations: getIterations,
        getWorkItems: getWorkItems
    }
})();
