import gi
gi.require_version('Gtk', '4.0')
from gi.repository import Gtk
from src.window import AIDENWindow

class AIDENApp(Gtk.Application):
    def __init__(self):
        super().__init__(application_id='com.agiledefense.aiden')

    def do_activate(self):
        window = AIDENWindow(application=self)
        window.present()

if __name__ == "__main__":
    app = AIDENApp()
    app.run()

