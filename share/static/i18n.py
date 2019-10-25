
I18N = {
    # WARN Check any added strings don't overflow sidebar width
    'en': {
        # Used in image
        'percent_heading': "Current readthrough",
        'recently_heading': "Recently finished",
        'currently_heading': "Currently reading",
        # Used in html
        'page_title': "Bible reading progress @ track.bible",
        'page_description': "Keep track of your Bible reading, and complete it at your own pace",
        'page_button': "OPEN APP",
    }
}


def get_strings(locale):
    if locale not in I18N:
        locale = 'en'
    return I18N[locale]
