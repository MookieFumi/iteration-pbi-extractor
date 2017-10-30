registerNS('app');

app.onInit = (function () {
    $("[data-role='submit']").on("click", function (e) {
        var fields = app.index.getFields();
        $.ajaxSetup({
            beforeSend: function (xhr) {
                var authorization = app.index.getAuthorizationHeader(fields.userName, fields.password);
                app.ajax.beforeSend(xhr, authorization);
            }
        });

        localStorage.setItem("userName", fields.userName);
        localStorage.setItem("password", fields.password);

        app.index.projects.get();
    });

    $("[data-role='projects']").on("change", "select", function () {
        app.index.teams.get();
    });

    $("[data-role='teams']").on("change", "select", function () {
        app.index.iterations.get();
    });

    $("[data-role='iterations']").on("click", "[data-role='iteration']", function () {
        var path = $(this).data().path;
        app.index.workItems.get(path);
    });

    GetLastLogin();

});

app.index = (function () {
    var config = {
        regEx: new RegExp("\<(.*?)\>"),
        registerHandlebarHelpers: function () {
            Handlebars.registerHelper('is_pbi', function (item, match, options) {
                if (item.workItemType === match) {
                    return true;
                } else {
                    return false;
                }
            });
            Handlebars.registerHelper("fromDateToDate", function (startDate, endDate) {
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
            project: $("select[name=project]").val(),
            team: $("select[name=team]").val(),
            userName: $("[data-role='form']").find("input[name=user]").val(),
            password: $("[data-role='form']").find("input[name=password]").val()
        }
    };

    function loadHandlebarsTemplates(templateName) {
        $.get('templates/' + templateName, function (template, textStatus, jqXhr) {
            $('body').append(template);
        });
    }

    var projects = {
        append: function (data) {
            var $projects = $("[data-role='projects']");
            var $select = $projects.find("select");
            $(data.value).each(function (index, element) {
                $select.append($('<option>', {
                    value: element.name,
                    text: element.name
                }));
            });
            $select.material_select();
            $projects.removeClass('hide');
        },
        get: function () {
            var fields = app.index.getFields();
            $.when(app.vsoService.getProjects(fields.userName, fields.password))
                .then(function (data, textStatus, jqXHR) {
                    app.index.projects.append(data);
                    teams.get();
                });
        }
    };

    var teams = {
        append: function (data) {
            var $teams = $("[data-role='teams']");
            var $select = $teams.find("select");
            $select.empty();
            $(data.value).each(function (index, element) {
                $select.append($('<option>', {
                    value: element.name,
                    text: element.name
                }));
            });
            $select.material_select();
            $teams.removeClass('hide');
        },
        get: function () {
            var fields = app.index.getFields();
            var $projects = $("[data-role='projects']");
            $.when(app.vsoService.getTeams(fields.userName, fields.password, fields.project))
                .then(function (data, textStatus, jqXHR) {
                    app.index.teams.append(data);
                    iterations.get();
                });
        }
    };

    var iterations = {
        append: function ($iterations, element) {
            var fields = app.index.getFields();
            var context = {
                path: element.path,
                name: element.name,
                startDate: element.attributes.startDate,
                finishDate: element.attributes.finishDate,
                iterationPath: fields.project + '/' + fields.team
            };
            var template = Handlebars.compile($("#iteration-template").html());
            var html = template(context);
            $iterations.append(html);
        },
        clear: function () {
            var $iterations = $('[data-role="iterations"]');
            $iterations.empty();
        },
        get: function () {
            app.index.iterations.clear();
            app.index.workItems.clear();
            var fields = app.index.getFields();
            var $iterations = $('[data-role="iterations"]');
            app.vsoService.getIterations(fields.project, fields.team, fields.userName, fields.password).done(function (data) {
                $(data.value).each(function (index, element) {
                    app.index.iterations.append($iterations, element);
                });
            });
        }
    };

    var workItems = {
        append: function ($workItems, element, path) {
            var assignedTo = element.fields["System.AssignedTo"];
            var imageUrl = assignedTo == undefined ? 'http://www.gravatar.com/avatar' : 'http://www.gravatar.com/avatar/' + md5(config.regEx.exec(assignedTo)[1]);
            var context = {
                title: element.fields["System.Title"],
                effort: element.fields["Microsoft.VSTS.Scheduling.Effort"],
                workItemType: element.fields["System.WorkItemType"],
                imageUrl: imageUrl,
                areaPath: path
            };
            var template = Handlebars.compile($("#workitem-template").html());
            var html = template(context);
            $('[data-role="workItems"]').append(html);
        },
        clear: function () {
            var $workItems = $('[data-role="workItems"]');
            $workItems.empty();
        },
        get: function (path) {
            app.index.workItems.clear();
            var fields = app.index.getFields();
            var $workItems = $('[data-role="workiIems"]');
            app.vsoService.getWorkItems(fields.project, path, fields.userName, fields.password)
                .done(function (data) {
                    app.index.workItems.clear();

                    if (data === null || data === undefined)
                        return;

                    $(data.value).each(function (index, element) {
                        app.index.workItems.append($workItems, element, path);
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
        teams: teams,
        getFields: getFields,
        getAuthorizationHeader: getAuthorizationHeader
    };
}());


function GetLastLogin() {
    var userNameTemp = localStorage.getItem("userName");
    var passwordTemp = localStorage.getItem("password");
    if ((userNameTemp !== null && userNameTemp) &&
        (passwordTemp !== null && passwordTemp)) {
        $("[data-role='form']").find("input[name=user]").val(userNameTemp);
        $("[data-role='form']").find("input[name=password]").val(passwordTemp);
        $("[data-role='submit']").trigger("click");
    }
}

