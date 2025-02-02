micro: micro.l micro.y micro.h microfuncs.c
	bison -d micro.y
	flex -o micro.lex.c micro.l
	cc -o $@ micro.tab.c micro.lex.c microfuncs.c -lfl
	
clean:
	rm -f lex.yy.c micro.tab.c micro.tab.h micro.lex.c micro
