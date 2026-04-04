import genlayer.gl as gl

class Test(gl.Contract):
    @gl.public.write
    def do_stuff(self):
        def task() -> str:
            val = gl.nondet.web.render("http://example.com", mode='text')
            return gl.nondet.exec_prompt(f"Summarize: {val}")
        
        result_str = gl.eq_principle.prompt_non_comparative(
            task,
            "Is the summary good?"
        )
