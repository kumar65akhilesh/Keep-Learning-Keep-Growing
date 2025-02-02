	/* Simplest version of the calculator */
%{
	#include <stdio.h>
	#include <string.h>
	#include "micro.h"	
	#define YYDEBUG 1
%}
%union {
	char str[32];
	struct ast *a;
	int d;
	float f;
}

/* Declare tokens */
%token BEGIN_T END_T
%token <str> ID
%token INTP_ FLOATP_ STRINGP_
%token INT_ FLOAT_ STRING_
%token IF_ THEN_ ELSE_ ENDIF_ WHILE_ 
%token VOID_ RETURN_ PROCEDURE_
%token NE GTE LTE EQUAL
%token <f> FLOATLITERAL
%token <str> STRINGLITERAL
%token READ WRITE 
%token <d> INTLITERAL 
%token <str> ASSIGN
%token SCANEOF
%type <a> ident primary expr stmt stmts program idlist exprlist method_pdecl func_call funct_pdecl function_decl method term factor ifelse if else expor expand expeq explogical method_decl parameter_list parameter

%%
sysgoal: program               			{ eval($1); } /* recursive descent through the AST */
	;

program: function_decl BEGIN_T stmts END_T       {$$ = newast('V',$1,$3);}
	|method_pdecl BEGIN_T stmts END_T		{$$ = newast(':',$1,$3);}
	|BEGIN_T stmts END_T	                     { $$ = $2; }
	;

method_pdecl: method_pdecl funct_pdecl		{$$ = newast('^', $1, $2);}
		|funct_pdecl				{$$ = $1;}
		;

funct_pdecl: method_decl BEGIN_T stmts END_T	{$$ = newast(',', $1, $3);}
	
		;

function_decl: method function_decl		{$$ = newast('@', $1, $2);}
	|method					{$$ = $1;}
	;

method: PROCEDURE_ INT_ ident '(' ')' BEGIN_T stmts END_T		{$$=newast((char) '1',$3, $7);}
	|PROCEDURE_ FLOAT_ ident '(' ')' BEGIN_T stmts END_T		{$$=newast((char) '2',$3, $7);}
	|PROCEDURE_ STRING_ ident '(' ')' BEGIN_T stmts END_T		{$$=newast((char) '3',$3, $7);}
	|PROCEDURE_ VOID_ ident '(' ')' BEGIN_T stmts END_T		{$$=newast((char) '4',$3, $7);}
	;

method_decl: PROCEDURE_ INT_ ident	'(' parameter_list ')'		{$$=newast('~', $3, $5);}
	|PROCEDURE_ FLOAT_ ident '(' parameter_list ')' 			{$$=newast('[', $3, $5);}
	|PROCEDURE_ STRING_ ident '(' parameter_list ')'			{$$=newast('(', $3, $5);}
	|PROCEDURE_ VOID_ ident '(' parameter_list ')'			{$$=newast(')', $3, $5);}
	;

parameter_list: parameter ',' parameter_list				{$$=newast(']', $1, $3);}
		|parameter							{$$=$1;}
		;

parameter: INTP_ ident			{$$=newast('$', $2, NULL);}
	|FLOATP_ ident			{$$=newast(';', $2, NULL);}
	|STRINGP_ ident			{$$=newast('#', $2, NULL);}
	|INT_ ident				{$$=newast('N', $2, NULL);}
	|FLOAT_ ident				{$$=newast('D', $2, NULL);}
	|STRING_ ident			{$$=newast('L', $2, NULL);}
	;

stmts: stmt                          { $$ = newast('A',$1,NULL); }
	| stmt stmts                  { $$ = newast('A',$1, $2);} 
	;
stmt: ident ASSIGN expor ';'                 		 {$$ = newast('=',$1, $3); }
	| ident ASSIGN ident '(' ')' ';'     	  	 {$$ = newast((char) '7',$1, $3);}
	| ident ASSIGN func_call ';'		 	 {$$ = newast('U',$1,$3);}
	| READ '(' idlist ')' ';'             		 {$$ = newast('R', $3, NULL); }
	| WRITE '(' exprlist ')' ';'          		 {$$ = newast('W', $3, NULL); }
	| INT_ idlist ';'		          		 {$$ = newast('N', $2, NULL);}/*number*/
	| FLOAT_ idlist ';'	                 		 {$$ = newast('D', $2, NULL);}/*double*/
	| STRING_ idlist ';'		        		 {$$= newast('L',$2, NULL);}/*letter*/
	| ifelse			       		 {$$ = $1;}	
	| WHILE_ '(' expor ')' BEGIN_T stmts END_T 	 {$$=newast('J',$3, $6);}
	| ident '(' ')' ';'		          		 {$$ = newast('5',$1,NULL);}
	| RETURN_ ident ';'		         		 {$$ = newast('6',$2,NULL);}
	| RETURN_ ';'			        		 {$$ = newast('8',NULL, NULL);}
       | func_call ';'					 {$$ = $1;}
	;

func_call: ident '(' exprlist ')' 				 {$$ = newast('?',$1,$3);}
	;

ifelse: if ENDIF_			{$$=newast('T',$1, NULL);}
	|if else ENDIF_		{$$=newast('Q', $1, $2);}
	;

if: IF_ '(' expr ')' THEN_ stmts		{$$=newast('O',$3, $6);}
	;

else: ELSE_ stmts			{$$=newast('Y',$2,NULL);}
	;


idlist: ident				      { $$ = $1; }
	| ident ',' idlist                { $$ = newast('I',$1, $3); }
	;

exprlist: expor				  { $$ = newast('E', $1, NULL); }
	| exprlist ',' expor			  { $$ = newast('E', $1, $3); }
	;

expor: expand				{$$=$1;}
	|expor '|' expand		{$$=newast('|',$1,$3);}
	;

expand: expeq				{$$=$1;}
	|expand '&' expeq		{$$=newast('&',$1,$3);}
	;

expeq: explogical				{$$=$1;}
	| expeq EQUAL explogical		{$$=newast('H',$1,$3);}
	| expeq NE explogical		{$$=newast('B',$1,$3);}
	;

explogical: expr			{$$=$1;}
	|explogical '>' expr		{$$=newast('>',$1,$3);}
	|explogical '<' expr		{$$=newast('<',$1,$3);}
	|explogical LTE expr		{$$=newast('C',$1,$3);}
	|explogical GTE expr		{$$=newast('G',$1,$3);}	
	;

expr: term	                   		  { $$ = $1; }
	| expr '+' term          		  { $$ = newast('+',$1, $3); }
	| expr '-' term		         { $$ = newast('-',$1, $3); }
	;

term: factor			     		{$$=$1;}
	|term '*' factor			{$$ = newast('*',$1,$3);}
	|term '/' factor			{$$ = newast('/',$1,$3);}
	|term '%' factor			{$$ = newast('%',$1,$3);}
	;

factor: primary			{$$=$1;}
	|'!' primary 			{$$=newast('!',$2,NULL);}
	;
	
primary: '(' expr ')'             		{ $$ = $2; }	
	| ident                          	{ $$ = $1; }
	| INTLITERAL				{ $$ = newnum($1); }	
	| FLOATLITERAL		       { $$ = newfloat($1);}
	| STRINGLITERAL			{ $$ = newstring($1);}
	;

ident: ID                         { $$ = newident($1);  }
	;

%%

