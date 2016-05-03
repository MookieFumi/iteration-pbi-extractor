registerNS('app');

app.index = (function() {
    var config = {
        regEx: new RegExp("\<(.*?)\>"),
        registerHandlebarHelpers: function() {
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
        }
    };

    function getAuthorizationHeader(userName, password) {
        //https://developer.mozilla.org/es/docs/Web/API/WindowBase64/btoa
        return window.btoa(userName + ":" + password);
    };

    function getFields() {
        return {
            project: $("select").val(),
            userName: $("[data-role='form']").find("input[name=user]").val(),
            password: $("[data-role='form']").find("input[name=password]").val()
        }
    };

    function loadHandlebarsTemplates(templateName) {
        $.get('templates/' + templateName, function(template, textStatus, jqXhr) {
            $('body').append(template);
        });
    }

    var projects = {
        append: function(data) {
            var $projects = $("[data-role='projects']");
            var $select = $projects.find("select");
            $(data.value).each(function(index, element) {
                $select.append($('<option>', {
                    value: element.name,
                    text: element.name
                }));
            });
            $select.material_select();
            $projects.removeClass('hide');
        },
        get: function() {
            var fields = app.index.getFields();
            $.when(app.vsoService.getProjects(fields.userName, fields.password))
                .then(function(data, textStatus, jqXHR) {
                    app.index.projects.append(data);
                    iterations.get();
                });
        }
    };

    var iterations = {
        append: function($iterations, element) {
            var context = {
                path: element.path,
                name: element.name,
                startDate: element.attributes.startDate,
                finishDate: element.attributes.finishDate
            };
            var template = Handlebars.compile($("#iteration-template").html());
            var html = template(context);
            $iterations.append(html);
        },
        clear: function() {
            var $iterations = $('[data-role="iterations"]');
            $iterations.empty();
        },
        get: function() {
            app.index.iterations.clear();
            app.index.workItems.clear();
            var fields = app.index.getFields();
            var $iterations = $('[data-role="iterations"]');
            app.vsoService.getIterations(fields.project, fields.userName, fields.password).done(function(data) {
                $(data.value).each(function(index, element) {
                    app.index.iterations.append($iterations, element);
                });
            });
        }
    };

    var workItems = {
        append: function($workItems, element) {
            var assignedTo = element.fields["System.AssignedTo"];
            var imageUrl = assignedTo == undefined ? 'http://www.gravatar.com/avatar' : 'http://www.gravatar.com/avatar/' + md5(config.regEx.exec(assignedTo)[1]);
            var context = {
                title: element.fields["System.Title"],
                effort: element.fields["Microsoft.VSTS.Scheduling.Effort"],
                workItemType: element.fields["System.WorkItemType"],
                imageUrl: imageUrl
            };
            var template = Handlebars.compile($("#workitem-template").html());
            var html = template(context);
            $('[data-role="workItems"]').append(html);
        },
        clear: function() {
            var $workItems = $('[data-role="workItems"]');
            $workItems.empty();
        },
        get: function(path) {
            app.index.workItems.clear();
            var fields = app.index.getFields();
            var $workItems = $('[data-role="workiIems"]');
            app.vsoService.getWorkItems(fields.project, path, fields.userName, fields.password)
                .done(function(data) {
                    app.index.workItems.clear();
                    $(data.value).each(function(index, element) {
                        app.index.workItems.append($workItems, element);
                    });
                });
        }
    };

    config.registerHandlebarHelpers();
    loadHandlebarsTemplates('iteration-template.hbs');
    loadHandlebarsTemplates('workitem-template.hbs');

    return {
        iterations: iterations,
        workItems: workItems,
        projects: projects,
        getFields: getFields,
        getAuthorizationHeader: getAuthorizationHeader
    };
}());
