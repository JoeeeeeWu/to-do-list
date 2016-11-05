(function () {
    var $form_add_task = $(".add-task"),
        $window = $(window),
        $body = $("body"),
        $input,
        task_list = [],
        $task_detail = $(".task-detail"),
        $task_detail_mask = $(".task-detail-mask"),
        $task_delete_trigger,
        $task_detail_trigger,
        curren_index,
        $update_form,
        $task_detail_content,
        $task_detail_content_input,
        $msg = $(".msg"),
        $msg_content = $msg.find(".msg-content"),
        $msg_confirm = $msg.find(".confirmed"),
        $alerter = $(".alerter"),
        $checkbox_complete;

    init();

    $form_add_task.on("submit", on_add_task_form_submit);
    $task_detail_mask.on("click", hide_task_detail);

    function pop(arg) {
        if (!arg) {
            console.log("pop title is required!");
        }
        var conf = {},
            $box,
            $mask,
            $title,
            $content,
            $confirm,
            $cancle,
            dfd,
            confirmed,
            timer;

        dfd = $.Deferred();

        if (typeof arg == "string") {
            conf.title = arg;
        } else {
            conf = $.extend(conf, arg);
        }

        $box = $('<div>' +
            '<div class="pop-title">' + conf.title + '</div>' +
            '<div class="pop-content"><button style="margin-right:10px;" class="confirm">确定</button><button class="cancle btn-danger">取消</button></div>' +
            '</div>').css({
             "position": "fixed",
            "width": "300px",
            "height": "auto",
            "padding":"20px",
            "background-color": "#fff",
            "color": "#444",
        });
        
        $title = $box.find(".pop-title").css({
            "padding": "10px 10px",
            "font-weight": "900",
            "font-size": "20px",
            "text-align": "center",
        });

        $content = $box.find(".pop-content").css({
            "padding": "10px 10px",
            "text-align": "center",
        });

        $confirm = $content.find("button.confirm");

        $cancle = $content.find("button.cancle");

        $mask = $("<div></div>").css({
            "position": "fixed",
            "top": "0",
            "bottom": "0",
            "left": "0",
            "right": "0",
            "background": "rgba(0,0,0,0.5)",
        });

        timer = setInterval(function () {
            if (confirmed !== undefined) {
                dfd.resolve(confirmed);
                clearInterval(timer);
                dismiss_pop();
            }
        }, 50);

        function on_confirmed() {
            confirmed = true;
            console.log("on_confirmed");
        }

        function on_cancle() {
            confirmed = false;
        }

        $confirm.on("click", on_confirmed);

        $cancle.on("click", on_cancle);

        $mask.on("click", on_cancle);

        function dismiss_pop() {
            $mask.remove();
            $box.remove();
        }

        function adjust_box_position() {
            var window_width = $window.width(),
                window_height = $window.height(),
                box_width = $box.width(),
                box_height = $box.height(),
                move_x,
                move_y;
            move_x = (window_width - box_width) / 2;
            move_y = (window_height - box_height) / 2 - 80;
            $box.css({
                "left": move_x,
                "top": move_y,
            });
        }

        $window.on("resize", function () {
            adjust_box_position();
            console.log("window");
        });

        $mask.appendTo($body);
        $box.appendTo($body);
        $window.resize();
        return dfd.promise();
    }

    function listen_msg_event() {
        $msg_confirm.on("click", function () {
            hide_msg();
        })
    }

    function on_add_task_form_submit(e) {
        var new_task = {};
        e.preventDefault();
        $input = $(this).find("input[name=content]");
        new_task.content = $input.val();
        if (!new_task.content) return;
        if (add_task(new_task)) {
            $input.val(null);
        }
    }

    function listen_task_detail() {
        var index;
        $(".task-item").on("dblclick", function () {
            index = $(this).data("index");
            show_task_detail(index);
        });
        $task_detail_trigger.on("click", function () {
            var $this = $(this),
                $item = $this.parent().parent();
            index = $item.data("index");
            show_task_detail(index);
        })
    }

    function listen_checkbox_complete() {
        $checkbox_complete.on("click", function () {
            var $this = $(this);

            var index = $this.parent().parent().data("index");
            var item = get(index);
            if (item.complete) {
                update_task(index, {
                    complete: false
                });
            } else {
                update_task(index, {
                    complete: true
                });
            }

        });
    }

    function get(index) {
        return store.get("task_list")[index];
    }

    function show_task_detail(index) {
        render_task_detail(index);
        current_index = index;
        $task_detail.show();
        $task_detail_mask.show();
    }

    function update_task(index, data) {
        if (!index || !task_list[index]) return;
        task_list[index] = $.extend({}, task_list[index], data);
        refresh_task_list();
    }

    function render_task_detail(index) {
        if (index === undefined || !task_list[index]) return;
        var item = task_list[index];
        var tpl = "<form>" +
            "<div class='content input-item'>" +
            item.content +
            "</div>" +
            "<div class='input-item'>" +
            "<input style='display:none;' type='text' name='content' value=" + (item.content || "") + "></input></div>" +
            "<div>" +
            "<div class='desc input-item'>" +
            "<label>活动详细内容：</label>" +
            "<textarea name='desc'>" +
            (item.desc || "") +
            "</textarea>" +
            "</div>" +
            "</div>" +
            "<div class='remind input-item'>" +
            "<label>提醒时间：</label>" +
            "<input class='datetime' type='text' name='remind_date' value='" + (item.remind_date || "") + "'>" +
            "</div>" +
            "<div class='input-item'>" +
            "<button type='submit'>更新</button>" +
            "</div>" +
            "</form >";
        $task_detail.html(null);
        $task_detail.html(tpl);
        $(".datetime").datetimepicker();
        console.log(tpl);
        $update_form = $task_detail.find("form");
        $task_detail_content = $update_form.find(".content");
        $task_detail_content_input = $update_form.find("[name=content]");

        $task_detail_content.on("dblclick", function () {
            $task_detail_content_input.show();
            $task_detail_content.hide();
        });

        $update_form.on("submit", function (e) {
            e.preventDefault();
            var data = {};
            data.content = $(this).find("[name=content]").val();
            data.desc = $(this).find("[name=desc]").val();
            data.remind_date = $(this).find("[name=remind_date]").val();
            console.log(data);
            update_task(index, data);
            hide_task_detail();
        })
    }

    function hide_task_detail() {
        $task_detail.hide();
        $task_detail_mask.hide();
    }

    function listen_delete_task() {
        $task_delete_trigger.on("click", function () {
            var $this = $(this);
            var $item = $this.parent().parent();
            var index = $item.data("index");
            pop("确定删除该待办事项吗？").then(function (r) {
                r ? delete_task(index) : null;
            })

        })

    }

    function init() {
        task_list = store.get("task_list") || [];
        listen_msg_event();
        if (task_list) {
            render_task_list();
            task_remind_check();
        }

    }

    function task_remind_check() {
        var current_timestamp,
            task_timestamp;
        var itl = setInterval(function () {
            for (var i = 0; i < task_list.length; i++) {
                var item = get(i);
                if (!item || !item.remind_date || item.informed) continue;
                current_timestamp = new Date().getTime();
                task_timestamp = new Date(item.remind_date).getTime();

                if (current_timestamp - task_timestamp >= 1) {
                    update_task(i, {
                        informed: true
                    });
                    show_msg(item.content);
                }
            }
        }, 500)

    }

    function show_msg(msg) {
        if (!msg) return;
        $msg_content.html(msg);
        $msg.show();
        $alerter.get(0).play();
    }

    function hide_msg(msg) {
        $msg.hide();
    }

    function add_task(new_task) {
        task_list.push(new_task);
        refresh_task_list();
        return true;
    }

    function refresh_task_list() {
        store.set("task_list", task_list);
        render_task_list();
    }

    function delete_task(index) {
        if (!index || !task_list[index]) return;
        delete task_list[index];
        refresh_task_list();
    }

    function render_task_list() {
        var $task_list = $(".task-list");
        $task_list.html("");
        var complete_item = [];
        for (var i = 0; i < task_list.length; i++) {
            var item = task_list[i];
            if (item && item.complete) {
                complete_item[i] = item;
            } else {
                var $task = render_task_item(item, i);
                $task_list.prepend($task);
            }
        }

        for (var j = 0; j < complete_item.length; j++) {

            $task = render_task_item(complete_item[j], j);
            if (!$task) continue;
            $task.addClass("completed");
            $task_list.append($task);
        }

        $task_delete_trigger = $(".action.delete");
        $task_detail_trigger = $(".action.detail");
        $checkbox_complete = $(".task-list .complete[type=checkbox]");
        listen_delete_task();
        listen_task_detail();
        listen_checkbox_complete();
    }

    function render_task_item(data, index) {
        if (!data || !index) return;
        list_item_tpl = '<li class="task-item" data-index=' + index + '>' +
            '<span><input class="complete"' + (data.complete ? 'checked ' : '') + 'type="checkbox"></span>' +
            '<span class="task-content">' + data.content + '</span>' +
            '<span class="fr">' +
            '<span class="action delete">删除</span>' +
            '<span class="action detail">详细</span>' +
            '</span>' +
            '</li>';
        return $(list_item_tpl);
    }
})()