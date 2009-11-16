function(doc) {

    if (doc.type == "Topic" && doc.topic_type == "Account") {
        emit([get_field("Username").content, get_field("Password").content], doc)
    }

    function get_field(field_id) {
        for (var i = 0, field; field = doc.fields[i]; i++) {
            if (field.id == field_id) {
                return field
            }
        }
    }
}
