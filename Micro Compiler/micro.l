/* Stuff */
%option noyywrap nodefault yylineno
%{
	#include <string.h>
	#include <stdlib.h>
	#include "micro.tab.h"
	#include "micro.h"

	void ident(char *);
	int check_table(char *);
	int add_to_table(char *);
%}
%%
"+"			|
"-"			|
"*"			|
"/"			|
"%"			|
"("			|
")"			|
"{"			|
"}"			|
","    		|
"&"			|
"|"			|
"<"			|
">"			|
"!"			|
";"		{return yytext[0]; }
"begin"	{ return BEGIN_T; }
"end"         { return END_T; }
"void"		{return VOID_;}
"int&"		{return INTP_;}
"float&"	{return FLOATP_;}
"string&"	{return STRINGP_;}
"int"	       {return INT_;}
"string"      {return STRING_;}
"float"       {return FLOAT_;}
"if"		{return IF_;}
"then"		{return THEN_;}
"else"		{return ELSE_;}
"endif"	{return ENDIF_;}
"while"	{return WHILE_;}
":="          { return ASSIGN; }
"return"	{return RETURN_;}
"procedure"	{return PROCEDURE_;}
"read"        { return READ; }
"write"       { return WRITE; }
"<="		{return LTE;}
">="		{return GTE;}
"=="		{return EQUAL;}
"!="		{return NE;}
\Z    		{ printf("eof\n"); return SCANEOF; }
[a-zA-Z]+[a-zA-Z0-9]*   { if (check_table(yytext) < 0) add_to_table(yytext); 
			  	strcpy(yylval.str, yytext);
		      		return ID; 
		   	   }
[0-9]{1,5}     { yylval.d = atoi(yytext); return INTLITERAL; }
[0-9]*\.?[0-9]+|[0-9]+\.?[0-9]*		{yylval.f=atof(yytext); return FLOATLITERAL;}
\"[a-zA-Z]*\"					{strcpy(yylval.str,yytext); return STRINGLITERAL;}
[ \t\n]      				       { /* ignore whitespace */ }
.						{ yyerror("Mystery character %c\n", *yytext); }
%%

