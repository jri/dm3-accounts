function dm3_accounts() {

    DEFAULT_USER = "admin"
    DEFAULT_PASSWORD = ""
    ENCRYPTED_PASSWORD_PREFIX = "-SHA256-"  // don't change this

    css_stylesheet("vendor/dm3-accounts/style/dm3-accounts.css")
    javascript_source("vendor/dm3-accounts/script/sha256.js")

    add_topic_type("Account", {
        fields: [
            {id: "Username", model: {type: "text"}, view: {editor: "single line"}, content: ""},
            {id: "Password", model: {type: "text"}, view: {editor: "single line"}, content: ""},
            {id: "Notes",    model: {type: "html"}, view: {editor: "multi line"},  content: ""}
        ],
        view: {
            icon_src: "vendor/dm3-accounts/images/top-hat.png"
        },
        implementation: "PlainDocument"
    })

    active_account = undefined



    /**************************************************************************************************/
    /**************************************** Overriding Hooks ****************************************/
    /**************************************************************************************************/



    this.init = function() {

        create_default_account()
        create_login_dialog()

        function create_default_account() {

            var users = get_all_accounts()
            if (!users.length) {
                create_topic("Account", {Username: DEFAULT_USER, Password: encrypt_password(DEFAULT_PASSWORD)})
            }

            function get_all_accounts() {
                return get_topics_by_type("Account")
            }
        }

        function create_login_dialog() {
            var login_dialog = $("<div>").attr("id", "login_dialog")
            var login_message = $("<div>").attr("id", "login_message").html("&nbsp;")
            login_dialog.append($("<div>").addClass("field-name").text("Username"))
            login_dialog.append($("<input>").attr({id: "login_username"}))
            login_dialog.append($("<div>").addClass("field-name").text("Password"))
            login_dialog.append($("<input>").attr({id: "login_password", type: "password"}))
            // Note: the login message container maintains the space when the login message is faded out (display=none)
            login_dialog.append($("<div>").attr("id", "login_message_container").append(login_message))
            $("body").append(login_dialog)
            $("#login_message_container").height($("#login_message").height())
            $("#login_dialog").dialog({
                title: "Login", buttons: {"OK": try_login}, modal: true,
                closeOnEscape: false, draggable: false, resizable: false,
                open: function() {
                    $(".ui-dialog-titlebar-close").hide()
                }
            })
        }

        function try_login() {
            var username = $("#login_username").val()
            var password = $("#login_password").val()
            var accounts = db.view("deepamehta3/dm3-accounts", {key: [username, encrypt_password(password)]}).rows
            if (accounts.length) {
                // set active account
                active_account = accounts[0].value
                //
                show_message("Login OK", "login_ok", function() {
                    $("#login_dialog").parent().fadeOut(400, function() {
                        $("#login_dialog").dialog("destroy")
                    })
                    // restore close box of the other dialogs
                    $(".ui-dialog-titlebar-close").show()
                })
            } else {
                show_message("Login failed", "login_failed")
            }
        }

        function show_message(message, css_class, fn) {
            $("#login_message").fadeOut(200, function() {
                $(this).text(message).removeClass().addClass(css_class).fadeIn(1000, fn)
            })
        }
    }

    this.pre_create = function(doc) {
        // Note: topics and relations might get created programatically, e.g. by other plugins, before the user has logged in.
        if (!active_account) {
            return
        }
        //
        doc.created_by = get_username()
    }

    this.pre_update = function(doc) {
        // encrypt password of new accounts
        if (doc.type == "Topic" && doc.topic_type == "Account") {
            // we recognize a new account (or changed password) if password doesn't begin with ENCRYPTED_PASSWORD_PREFIX
            var password_field = get_field(doc, "Password")
            var password = password_field.content
            if (password.substring(0, ENCRYPTED_PASSWORD_PREFIX.length) != ENCRYPTED_PASSWORD_PREFIX) {
                password_field.content = encrypt_password(password)
            }
        }
        // Note: topics and relations might get created programatically, e.g. by other plugins, before the user has logged in.
        if (!active_account) {
            return
        }
        //
        doc.modified_by = get_username()
    }



    /************************************************************************************************/
    /**************************************** Custom Methods ****************************************/
    /************************************************************************************************/



    function get_username() {
        return get_value(active_account, "Username")
    }

    function encrypt_password(password) {
        return ENCRYPTED_PASSWORD_PREFIX + SHA256(password)
    }
}
