registerNS('app');

app.vsoService = (function() {
    var config = {
        url: {
            iteration: 'https://analyticalways.visualstudio.com/DefaultCollection/{0}/_apis/work/teamsettings/iterations?api-version=v2.0',
            workItemsInIteration: 'https://analyticalways.visualstudio.com/DefaultCollection/{0}/_apis/wit/wiql?api-version=2.0',
            workItemsDetail: 'https://analyticalways.visualstudio.com/DefaultCollection/_apis/wit/workitems?api-version=2.0'
        }
    };
    var regEx = new RegExp("\<(.*?)\>");

    var registerHandlebarHelpers = (function() {
        Handlebars.registerHelper('is_pbi', function(item, match, options) {
            if (item.workItemType === match) {
                return true;
            } else {
                return false;
            }
        });
        Handlebars.registerHelper("fromDateToDate", function(startDate, endDate) {
            if (startDate == null) {
                return 'No data';
            }
            return moment(startDate).format('DD/MM/YYYY') + ' - ' + moment(endDate).format('DD/MM/YYYY');
        });
    })();

    var getAuthorizationHeader = function (userName, password) {
        return window.btoa(userName + ":" + password);
    };

    var getIterations = function(collectionName, userName, password) {        
        var header = getAuthorizationHeader(userName, password);
        app.ajax.get(config.url.iteration.replace('{0}', collectionName), header).done(function(data) {
            var $iterations = $('[data-role="iterations"]');
            $iterations.empty();
            $(data.value).each(function(index, element) {
                createIteration($iterations, element);
            });
        }).fail(function(jqxhr, textStatus, error) {
            var err = textStatus + ", " + error;
            Materialize.toast('There was a problem retrieving data', 1500, 'rounded');
        });
    };

    var getWorkItems = function(collectionName, userName, password) {        
        var $this = $(this);
        var iterationPath = $this.data().path;
        var data = JSON.stringify({
            "query": "SELECT * FROM WorkItems WHERE [System.TeamProject] = '" + collectionName + "' AND ([System.WorkItemType] = 'Product Backlog Item' OR [System.WorkItemType] = 'Bug') AND [System.IterationPath] = '" + iterationPath + "'"
        });
        var url = config.url.workItemsInIteration.replace('{0}', collectionName);
        var header = getAuthorizationHeader(userName, password);
        $.when(app.ajax.post(url, header, data))
            .then(function(data, textStatus, jqXHR) {
                if (data.workItems.length == 0) {
                    Materialize.toast('There are no data available', 1500, 'rounded');
                    $('[data-role="workItems"]').empty();
                    return;
                }
                var url = config.url.workItemsDetail + '&ids=' + _.pluck(data.workItems, 'id');
                app.ajax.get(url, header).done(function(returnedData) {
                    var $workitems = $('[data-role="workItems"]');
                    $workitems.empty();
                    $(returnedData.value).each(function(index, element) {
                        createWorkItem($workitems, element);
                    });
                });
            });
    };

    var createIteration = function($iterations, element) {
        var context = {
            path: element.path,
            name: element.name,
            startDate: element.attributes.startDate,
            finishDate: element.attributes.finishDate
        };
        var template = Handlebars.compile($("#iteration-template").html());
        var html = template(context);
        $iterations.append(html);
    };

    var createWorkItem = function($workitems, element) {
        var assignedTo = element.fields["System.AssignedTo"];
        var imageUrl = assignedTo == undefined ? 'http://www.gravatar.com/avatar' : 'http://www.gravatar.com/avatar/' + md5(regEx.exec(assignedTo)[1]);
        var context = {
            title: element.fields["System.Title"],
            effort: element.fields["Microsoft.VSTS.Scheduling.Effort"],
            workItemType: element.fields["System.WorkItemType"],
            imageUrl: imageUrl
        };
        var template = Handlebars.compile($("#workitem-template").html());
        var html = template(context);
        $('[data-role="workItems"]').append(html);
    };

    return {
        getIterations: getIterations,
        getWorkItems: getWorkItems
    }
})(window);
