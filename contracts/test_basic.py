import genlayer.gl as gl

class Test(gl.Contract):
    def __init__(self):
        pass

    @gl.public.view
    def hello(self) -> str:
        return "world"
