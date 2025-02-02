#include <stdio.h>
#include <stdlib.h>
#include <stdarg.h>
#include <string.h>
#include "micro.h"
#include "micro.tab.h"

//#define CONSOLEOUT

#ifdef	CONSOLEOUT
#define CPRINT(L, S1, S2)  ( printf("Line %d: %s = %s\n", L, S1, S2) )
#define CPRINT_RD(L, S)  ( printf("Line %d: read %s\n", L, S) )
#define CPRINT_WR(L, S) ( printf("Line %d: write %s\n", L, S) )
#define CPRINT_ASSIGN(L, S) ( printf("Line %d: %s\n", L, S) )
#else
#define CPRINT(L, S1, S2)
#define CPRINT_RD(L, S)
#define CPRINT_WR(L, S)
#define CPRINT_ASSIGN(L, S)
#endif

struct sym_table *st, *tempst, *mainst;

FILE *fp_out; // pointer to 3-address output file.

struct identqueuenode *identqueuehead;
struct sym_table *procedure[15];
enum data_types ident_type;
int in_main = 1;
static int reading_ident_list;
static int writing_ident_list;
static int reading_integer_list;
static int reading_float_list;
static int reading_string_list;
static int parent;
int return_type = 0;
int stindex=-1;
int in_method = 0;
static int tempvarindex;
static int lineno = 1;
static int label = 1;
static int count = 0;
char procname[20][20];
int proctype[20];
int procindex;
int proccount;
char fcall[50];
int proc_used = 0;
int procp_used = 0;
int para_write = 0;
int funcp_write = 0;
int count_para = 0;
char param_name[20][20];
int name = 0;
char pointer_variables[20][20];
char procedure_names[20][20];
int procp_number;
char procedure_compare[20][20];
int procp_compare_number;
int number = 0;

//done by me
char tmpname[4], tmpstr[4];



static int generate_temp;
static int write_ctl;

TEMP_NAME tempvars[] = {"t1", "t2", "t3", "t4", "t5", "t6", "t7", "t8", "t9", "t10"};

/**********************************
 * LEXER FUNCTIONS                *
 **********************************/
 
/*
 * Return -1 if the identifier is not already in the symbol table,
 * return zero or greater (the index value) if it is.
 */
int check_table(char* ident)
{
	
	int i;
	
	if (!st)
	{
		fprintf(stderr,"error: invalid symbol table pointer\n");
	}
	for (i = 0; i < st->size; i++)
	{
		if (strcmp(ident,st->entries[i].ident) == 0)
			return i;
	}
	return -1;
	
}


//check the symbol table for individual procedures, returns the postion of the identifier otherwise -1

int procedure_check_table(char* ident)
{
	
	int i;
	
	if (!(procedure[proccount-1]))
	{
		fprintf(stderr,"error: invalid symbol table pointer\n");
	}
	for (i = 0; i < (procedure[proccount-1])->size; i++)
	{
		if (strcmp(ident,(procedure[proccount-1])->entries[i].ident) == 0)
			return i;
	}
	return -1;
	
}

/*
 * Add an identifier to the symbol table for the procedures. Returns the
 * number of symbols in the current table.
 */



int procedure_add_to_table(char* ident)
{
	if (procedure[proccount-1]-> size == procedure[proccount-1]->max_size)
	{
		procedure[proccount-1]->max_size <<= 2;
		//realloc st->entries, doubling the size of the available space 
		procedure[proccount-1]->entries = realloc(procedure[proccount-1]->entries, procedure[proccount-1]->max_size);
	}
	
	strcpy(procedure[proccount-1]->entries[procedure[proccount-1]->size].ident, ident);
	procedure[proccount-1]->entries[procedure[proccount-1]->size].defined = 0;
	procedure[proccount-1]->size++;
	return procedure[proccount-1]->size;
}

/*
 * Add an identifier to the symbol table. Returns the
 * number of symbols in the current table.
 */


int add_to_table(char* ident)
{
	if (st-> size == st->max_size)
	{
		st->max_size <<= 2;
		//realloc st->entries, doubling the size of the available space 
		st->entries = realloc(st->entries, st->max_size);
	}
	
	strcpy(st->entries[st->size].ident, ident);
	st->entries[st->size].defined = 0;
	st->size++;
	return st->size;
}

/*
 * Display the formatted symbol table to the console
 */
void show_symbol_table()
{
	int s;
	
	printf("Symbol Table Contents:\n");
	if (st->size == 0)
	{
		printf("Empty table\n");
		return;
	}
	for (s = 0; s < st->size; s++)
	{
		printf("%d: %s\n", s, st->entries[s].ident);
	}
}

// display all the symbol table when the procedures are used

void procedure_show_symbol_table()
{
	int s;
	int i;
	for(i=0;i<proccount;i++)
	{
	printf("Symbol Table %d Contents:\n", i+1);
	if (procedure[i]->size == 0)
	{
		printf("Empty table\n");
		return;
	}
	for (s = 0; s < procedure[i]->size; s++)
	{
		//char var[6];
		//strcpy(var, procedure[i]->entries.type); 
		printf("%d: %s\n", s, procedure[i]->entries[s].ident);
	}
	}
}


/**********************************
 * PARSER FUNCTIONS               *
 **********************************/
struct ast *newast(int nodetype, struct ast *l, struct ast *r)
{
	struct ast *a = malloc(sizeof(struct ast));
	
	if (!a)
	{
		yyerror("out of space");
		exit(0);
	}
	
	a->nodetype = nodetype;
	a->l = l;
	a->r = r;
	
	return a;
}

struct ast *newident(char *s)
{
  struct identval *a = malloc(sizeof(struct identval));
  
  if(!a) {
    yyerror("out of space");
    exit(0);
  }
  a->nodetype = 'S';
  strcpy(a->ident, s);
  return (struct ast *)a;
}

/*
 * Add a new numeric literal to the AST
 */
struct ast* newnum(int d) 
{
	struct numval *a = malloc(sizeof(struct numval));
	
	if (!a) {
		yyerror("out of space");
		exit(0);
	}
	
	a->nodetype = 'K'; // type K for constant 
	sprintf(a->number,"%d", d);
	
	return (struct ast *) a;
}

/*
* Add a new float literal to AST
*/
struct ast* newfloat(float f) 
{
	struct floatval *a = malloc(sizeof(struct floatval));
	
	if (!a) {
		yyerror("out of space");
		exit(0);
	}
	
	a->nodetype = 'F'; // type F for constant 
	sprintf(a->number,"%f", f);
	
	return (struct ast *) a;
}
/*
* Add a new string literal to AST
*/
struct ast* newstring(char *s) 
{
	struct stringval *a = malloc(sizeof(struct stringval));
	
	if (!a) {
		yyerror("out of space");
		exit(0);
	}
	
	a->nodetype = 'Z'; // type F for constant 
	sprintf(a->number,"%s", s);
	
	return (struct ast *) a;
}


void yyerror(char *s, ...)
{
	va_list ap;
	va_start(ap, s);
	
	fprintf(stderr,"%d: error: ", yylineno);
	vfprintf(stderr, s, ap);
	fprintf(stderr, "\n");
}


/*
 * Function: set_identifier_defined
 *
 * Iterate through the symbol table until the element with the
 * input lexeme is found and set it's 'defined' attribute to 1.
 *
 * Return positive non-zero value on success, -1 otherwise
 */
int set_identifier_defined(char *lexeme)
{
	
	int i;
	
	for (i = 0; i < st->size; i++)
	{
		if (strcmp(lexeme, st->entries[i].ident) == 0)
		{
			if (st->entries[i].defined == 0)
			{
				st->entries[i].defined = 1;
				st->entries[i].type = ident_type;
			}
			break;
		}
	}
	
	return i == st->size ? -1 : i;
	
}

// set the defined attribute of each identifier to 1 in the corresponding symbol table of each procedure

int procedure_set_identifier_defined(char *lexeme)
{
	
	int i;
	
	for (i = 0; i < procedure[proccount-1]->size; i++)
	{
		if (strcmp(lexeme, procedure[proccount-1]->entries[i].ident) == 0)
		{
			if (procedure[proccount-1]->entries[i].defined == 0)
			{
				procedure[proccount-1]->entries[i].defined = 1;
				procedure[proccount-1]->entries[i].type = ident_type;
			}
			break;
		}
	}
	
	return i == procedure[proccount-1]->size ? -1 : i;
	
}


/*
 * FUNCTION: is_valid_rvalue
 */

void is_valid_rvalue(char *lexeme)
{
	int i;
	
	for (i = 0; i < st->size; i++)
	{
		if (strcmp(lexeme, st->entries[i].ident) == 0 && st->entries[i].defined > 0)
		{
			break;
		}
	}
	if (i == st->size)
	{
		yyerror("Undefined identifier %s is invalid rvalue\n", lexeme);
		fclose(fp_out);
		exit(0);
	}
}

// checks that the identifier is defined before being used in each function

void procedure_is_valid_rvalue(char *lexeme)
{
	int i;
	
	for (i = 0; i < procedure[proccount-1]->size; i++)
	{
		if (strcmp(lexeme, procedure[proccount-1]->entries[i].ident) == 0 && procedure[proccount-1]->entries[i].defined > 0)
		{
			break;
		}
	}
	if (i == procedure[proccount-1]->size)
	{
		yyerror("Undefined identifier %s is invalid variable name in the procedure %d\n", lexeme, proccount);
		fclose(fp_out);
		exit(0);
	}
}

// checks that if a invalid procedure is not called

int is_valid_procname(char *lexeme)
{
	int i;
	//printf("looking for %s\n",lexeme);
	for (i = 0; i < procindex; i++)
	{
		//printf("%d = %s\n", i, procname[i]);
		if (strcmp(lexeme, procname[i]) == 0)
		{
			break;
		}
	}
	if (i == procindex)
	{
		yyerror("invalid procedure name %s\n", lexeme);
		fclose(fp_out);
		exit(0);
	}
	return i;
}

/*
 * FUNCTION: add_ident_to_queue
 *
 * Add an identifier appearing within an identifier list
 * as argument to a read operation to the queue for 
 * output to the intermediate code as an instruction of the form
 * "read ID"
 */

void add_ident_to_queue(char *ident)
{
	struct identqueuenode *newnode, *tmp;
	
	newnode = malloc(sizeof(struct identqueuenode));
	newnode->ident = ident;
	newnode->next = NULL;
		
	if (!identqueuehead)
	{
		identqueuehead = newnode;
	}
	else
	{
		tmp = identqueuehead;
		while (tmp->next)
		{
			tmp = tmp->next;
		}	
		tmp->next = newnode;
	}
}

 /*
 *prints the identifiers appearing in the read statement
 */

int print_read_input_idents(int lineno)
{
	struct identqueuenode *tmp;
	
	tmp = identqueuehead;
	while (tmp)
	{
		//set_identifier_defined(tmp->ident);
		
		CPRINT_RD(lineno, tmp->ident);
		fprintf(fp_out,"Line %d: read %s\n",lineno++, tmp->ident);
		tmp = tmp->next;
	}
	
	return lineno;
}

// prints the integer variables in the 

int print_read_integer_idents(int lineno)
{
	struct identqueuenode *tmp;
	
	tmp = identqueuehead;
	 
	while (tmp)
	{
		ident_type = 1;
		set_identifier_defined(tmp->ident);
		if(proc_used == 1)
		procedure_set_identifier_defined(tmp->ident);
		CPRINT_RD(lineno, tmp->ident);
		if(para_write == 1)
			{
			strcat(procedure_names[procp_number-1], "1");
			fprintf(fp_out,"int %s ", tmp->ident);
			strcpy(param_name[name++],tmp->ident);
			}
		else
			fprintf(fp_out,"Line %d: %s = 0\n",lineno++, tmp->ident);
		tmp = tmp->next;
	}
	
	return lineno;
}

//prints the float variables

int print_read_float_idents(int lineno)
{
	struct identqueuenode *tmp;
	
	tmp = identqueuehead;
	while (tmp)
	{
		ident_type = 2;
		set_identifier_defined(tmp->ident);
		if(proc_used == 1)
		procedure_set_identifier_defined(tmp->ident);
		CPRINT_RD(lineno, tmp->ident);
		if(para_write == 1)
			{
			strcat(procedure_names[procp_number-1],"2");
			fprintf(fp_out,"float %s ", tmp->ident);
			strcpy(param_name[name++],tmp->ident);
			}
		else
		fprintf(fp_out,"Line %d: %s = 0.0\n",lineno++, tmp->ident);
		tmp = tmp->next;
	}
	
	return lineno;
}

// prints the string variables

int print_read_string_idents(int lineno)
{
	struct identqueuenode *tmp;
	
	tmp = identqueuehead;
	while (tmp)
	{
		ident_type = 3;
		if(proc_used == 1)
		procedure_set_identifier_defined(tmp->ident);	
		set_identifier_defined(tmp->ident);
		CPRINT_RD(lineno, tmp->ident);
		if(para_write == 1)
			{
			strcat(procedure_names[procp_number-1],"3");
			fprintf(fp_out,"string %s ", tmp->ident);
			strcpy(param_name[name++],tmp->ident);
			}
		else

		fprintf(fp_out,"Line %d: string %s\n",lineno++, tmp->ident);
		tmp = tmp->next;
	}
	
	return lineno;
}


//generates  the three address code

void gencode(char *s)
{
char tempstr[6] ;
int i = 0;
int len = strlen(s);
int top = 0;
char d[6] ;
char stack[100][6];
while(i<len)
{
if (s[i] != 'B' && s[i] != 'C' && s[i] != 'G' && s[i] != 'H')
{
if((isalpha(s[i]) || isdigit(s[i])) )
	{
	sprintf(d," %c ", s[i]);
	strcpy(stack[top] ,  d);
	
	top=top+1;
	}
}
if(s[i] == '+' || s[i] == '-' || s[i] == '*' || s[i] == '/' || s[i] == '%' || s[i] == '|' || s[i] == '&' || s[i] == '>' || s[i] == '<')
{
	top =top-2;
	sprintf(tempstr,"%s",tempvars[tempvarindex++]);
	fprintf(fp_out, "Line %d: %s = %s %c %s\n",lineno++, tempstr, stack[top], s[i], stack[top+1] );
	strcpy(stack[top++] , tempstr);
}

if(s[i] == 'B')
{
	top =top-2;
	sprintf(tempstr,"%s",tempvars[tempvarindex++]);
	fprintf(fp_out, "Line %d: %s = %s %c%c %s\n",lineno++, tempstr, stack[top], '!', '=', stack[top+1] );
	strcpy(stack[top++] , tempstr);
}

if(s[i] == 'C')
{
	top =top-2;
	sprintf(tempstr,"%s",tempvars[tempvarindex++]);
	fprintf(fp_out, "Line %d: %s = %s %c%c %s\n",lineno++, tempstr, stack[top], '<', '=', stack[top+1] );
	strcpy(stack[top++] , tempstr);
}

if(s[i] == 'G')
{
	top =top-2;
	sprintf(tempstr,"%s",tempvars[tempvarindex++]);
	fprintf(fp_out, "Line %d: %s = %s %c%c %s\n",lineno++, tempstr, stack[top], '>', '=', stack[top+1] );
	strcpy(stack[top++] , tempstr);
}

if(s[i] == 'H')
{
	top =top-2;
	sprintf(tempstr,"%s",tempvars[tempvarindex++]);
	fprintf(fp_out, "Line %d: %s = %s %c%c %s\n",lineno++, tempstr, stack[top], '=', '=', stack[top+1] );
	strcpy(stack[top++] , tempstr);
}
i=i+1;
}
}




char* eval(struct ast* a)
{
	
	char *val, *rval, *lval, tempo, temp_variable[10];
	//char tmpname[4], tmpstr[4];
	
	switch (a->nodetype)
	{
		case 'K':
			return ((struct numval *) a)->number; // Leaf node
		case 'F':
			return ((struct floatval *) a)->number; // Leaf node
			reading_ident_list = 1;
			break;
		case 'Z':
			return ((struct stringval *) a)->number; // Leaf node
		case 'R':
			identqueuehead = NULL;
			reading_ident_list = 1;
			reading_integer_list = 0;
			reading_float_list = 0;
			reading_string_list = 0;

			break;
		case '$':
			
		case 'N':
			identqueuehead = NULL;
			reading_integer_list = 1;
			reading_ident_list = 0;
			//integer_ident_list = 0;
			reading_float_list = 0;
			reading_string_list = 0;
			break;
		case ';':

		case 'D':
			identqueuehead = NULL;
			reading_float_list = 1;
			reading_ident_list = 0;
			reading_integer_list = 0;
			//float_ident_list = 0;
			reading_string_list = 0;
			break;
		case '#':
		case 'L':
			identqueuehead = NULL;
			reading_string_list = 1;
			reading_ident_list = 0;
			reading_integer_list = 0;
			reading_float_list = 0;
			//string_ident_list = 0;
			break;
		case 'S':
			if (reading_integer_list == 1)
				{ 				
				add_ident_to_queue(((struct identval *) a)->ident);				
				if(in_main==0)
					{
					procedure_add_to_table(((struct identval *) a)->ident);
					
					}
				}				
			if (reading_float_list == 1) 
				{ 
				add_ident_to_queue(((struct identval *) a)->ident);
				if(in_main==0)
					{
					procedure_add_to_table(((struct identval *) a)->ident);
					
					}
				}
			if (reading_string_list == 1)
				{ 
				add_ident_to_queue(((struct identval *) a)->ident);
				if(in_main==0)
					{
					procedure_add_to_table(((struct identval *) a)->ident);

					}
				}
			if (reading_ident_list == 1) 
				{
				is_valid_rvalue( ((struct identval *) a)->ident );
				if(in_main == 0)
					procedure_is_valid_rvalue(((struct identval *) a)->ident );	
				add_ident_to_queue(((struct identval *) a)->ident);
				}
			
			//remove this
			//add_ident_to_queue(((struct identval *) a)->ident);

			return((struct identval *) a)->ident; // Leaf node
		case 'W':
			break;
		case 'J':
			count++;			
			 break;
		case 'A':
			if (para_write==1)
				{
				para_write=0;
				fprintf(fp_out,") \n");
				}

			{
			int a =0 ;
			if(name!=0){
			for(a=name-1;a>-1;a--)
				{
				fprintf(fp_out,"Line %d: %s = param\n",lineno++, param_name[a]);
				}
			}}
			name = 0;
			break;
		case '+':			
		case '-':			
		case '*':			
		case '/':			
		case '%':
		case '&':
		case '|':
		case '!':		
		case 'B':
		case 'C':
		case 'G':
		case 'H':
		case '<':
		case '>':
			break;
		case '=':break;
		case 'I':
			break;
		case 'T':
			break;
		case 'Q':
			parent = 1;
			break;
		case 'O':
		case 'Y':
			break;
		case 'P':
			printf("This is a primary symbol\n");
			break;
		case 'E':
			break;
		case '1':
			in_method=1;			
			in_main = 0;
			procedure[proccount] = (struct sym_table*) malloc(sizeof(struct sym_table));
			procedure[proccount]->size=0;
			procedure[proccount]->max_size=32;
			procedure[proccount]->entries = (struct sym_table_entry*) malloc(procedure[proccount]->max_size*sizeof(struct sym_table_entry));
			proccount++;
			break;
		case '2':			
			in_main = 0;
			procedure[proccount] = (struct sym_table*) malloc(sizeof(struct sym_table));
			procedure[proccount]->size=0;
			procedure[proccount]->max_size=32;
			procedure[proccount]->entries = (struct sym_table_entry*) malloc(procedure[proccount]->max_size*sizeof(struct sym_table_entry));
			proccount++;
			break;

		case '3':			
			in_main = 0;
			procedure[proccount] = (struct sym_table*) malloc(sizeof(struct sym_table));
			procedure[proccount]->size=0;
			procedure[proccount]->max_size=32;
			procedure[proccount]->entries = (struct sym_table_entry*) malloc(procedure[proccount]->max_size*sizeof(struct sym_table_entry));
			proccount++;
			break;

		case '4':
			in_main = 0;
			procedure[proccount] = (struct sym_table*) malloc(sizeof(struct sym_table));
			procedure[proccount]->size=0;
			procedure[proccount]->max_size=32;
			procedure[proccount]->entries = (struct sym_table_entry*) malloc(procedure[proccount]->max_size*sizeof(struct sym_table_entry));
			proccount++;
			break;

		case '5':
			break;

		case '6':
			
			break;

		case '7':
			break;

		case '8':
			fprintf(fp_out,"Line %d: return \n", lineno++);
			break;

		case 'V':
			proc_used=1;
			break;
		case '@':
			break;
		case '^':
			
			break;
		case '~':
			para_write=1;			
			break;
		case '[':
			para_write=1;
			break;
		case '(':
			para_write=1;
			break;
		case ')':
			para_write=1;
			break;
		case '_':
			break;
		case ']':
			break;
		case '9':
			break;
		case ':':
			procp_used = 1;
			break;
		case '.':
			break;
		case ',':
			break;

		case '?':
			funcp_write = 1;
			break;
		case 'U':
			funcp_write = 0;
			count_para = 0;
			break;
		default:
			printf("Error: it's here at top Unknown node type: %c\n", a->nodetype);
			return;
	}

	if (a->l)  {
		lval = eval(a->l);
	
		switch (a->nodetype)
		{
			case 'R':
				reading_ident_list = 0;
				reading_integer_list = 0;
				reading_float_list = 0;
				reading_string_list = 0;
				break;
			case 'W':
				if (a->l->nodetype == '+' || a->l->nodetype == '-' || a->l->nodetype == '*' || a->l->nodetype == '/')
				{
					CPRINT(lineno, tempvars[tempvarindex], lval);
					fprintf(fp_out,"Line %d: %s = %s\n", lineno++, tempvars[tempvarindex], lval);
					sprintf(lval,"%s", tempvars[tempvarindex++]);
				}
				break;
			case '=':
				is_valid_rvalue(lval);
				if(in_main==0)
					procedure_is_valid_rvalue(lval);
				strcat(lval, " = ");
				break;
			case '+':
			case '-':
			case '*':
			case '/':
			case '%':
			case '&':
			case '|':
			case '!':
			case 'B':
			case 'C':
			case 'G':
			case 'H':
			case '<':
 			case '>':

				break;
			case 'A':
			case 'I':
			case 'P':
				break;
			case 'J':
				fprintf(fp_out,"Line %d: Label %d:\n",lineno++, label++);
				gencode(lval);
				fprintf(fp_out,"Line %d: condition = %s\n",lineno++, tempvars[tempvarindex-1]);
				fprintf(fp_out,"Line %d: if(condition) goto Label %d:\n",lineno++, label++);
				fprintf(fp_out,"Line %d: goto Label %d:\n",lineno++,label++);
				break;
			case '$':
				strcpy(pointer_variables[number++],lval);
				//printf("%s\n",lval);
			case 'N':
				reading_ident_list = 0;
				reading_integer_list = 0;
				reading_float_list = 0;
				reading_string_list = 0;
				break;
			case ';':
				strcpy(pointer_variables[number++],lval);
	
			case 'D':
				reading_ident_list = 0;
				reading_integer_list = 0;
				reading_float_list = 0;
				reading_string_list = 0;
				break;	
			case '#':
				strcpy(pointer_variables[number++],lval);

			case 'L':
				reading_ident_list = 0;
				reading_integer_list = 0;
				reading_float_list = 0;
				reading_string_list = 0;
				break;	
			case 'T':
				break;
			case 'Q':
				
				break;
			case 'O':
				fprintf(fp_out,"Line %d: condition = %s\n",lineno++, lval);
				fprintf(fp_out,"Line %d: if !(condition) then goto Label 1 \n",lineno++);
				
				break;
			case 'Y':
				
				fprintf(fp_out,"Line %d: Label 3: \n",lineno++);
				break;

			case 'E':		
					
				if (a->l->nodetype == '+' || a->l->nodetype == '-')
				{
					CPRINT(lineno, tempvars[tempvarindex], lval);
					fprintf(fp_out,"Line %d: %s = %s\n", lineno++, tempvars[tempvarindex], lval);
					sprintf(lval,"%s", tempvars[tempvarindex++]);
				}
				break;
			case 'S':
				
				return lval;
				break;
			case '1':
				return_type = 1;
				fprintf(fp_out,"Line %d: procedure int %s ()\n", lineno++, lval);
				proctype[procindex] = 1;
				strcat(procname[procindex++],lval);
				break;
			case '2':
				return_type = 2;
				fprintf(fp_out,"Line %d: procedure float %s ()\n", lineno++, lval);
				proctype[procindex]=2;
				
				strcat(procname[procindex++],lval);
				break;
			case '3':
				return_type = 3;
				fprintf(fp_out,"Line %d: procedure string %s ()\n", lineno++, lval);
				proctype[procindex]=3;
			       strcat(procname[procindex++],lval);
			       break;

			case '4':
				fprintf(fp_out,"Line %d: procedure void %s ()\n", lineno++, lval);
				strcat(procname[procindex++],lval);
				break;

			case '5':
				fprintf(fp_out,"Line %d: Call %s(), 0 \n", lineno++, lval);
				break;
			case '6':
				if(procp_used == 1)
					{
					if(number != 0)
						{
							int i = 0;
							for(i = 0; i<number; i++)
								fprintf(fp_out,"Line %d: param = %s\n", lineno++, pointer_variables[i]);
	
							number = 0;
						}	
					fprintf(fp_out,"Line %d: return %s \n", lineno++, lval);
						
					}
				else
				{				
				in_method=0;
				procedure_is_valid_rvalue(lval);
				int loc = procedure_check_table(lval);
				if(procedure[proccount-1]->entries[loc].type != return_type)
					yyerror(" return type do not match\n");
				fprintf(fp_out,"Line %d: return %s \n", lineno++, lval);
				}
				break;
			case '8':
				fprintf(fp_out,"Line %d: return \n", lineno++);
				break;
			case '7':				
				strcat(lval, " = ");
				break;
			case 'V':
			case '@':
				break;
			case '^':
				break;
			case '~':
				fprintf(fp_out,"Line %d: procedure int %s (", lineno++, lval);
				strcpy(procedure_names[procp_number++],lval);
				break;
			case '[':
				fprintf(fp_out,"Line %d: procedure float %s (", lineno++, lval);

				break;
			case '(':
				fprintf(fp_out,"Line %d: procedure string %s (", lineno++, lval);

				break;
			case ')':
				fprintf(fp_out,"Line %d: procedure void %s (", lineno++, lval);

				break;
			case '_':
				break;
			case ']':
				break;
			case '9':
				break;
			case ':':
				break;
			case '.':
				break;
			case ',':
				break;

			case '?':
				//printf("%s, ", lval);
				strcpy(procedure_compare[procp_compare_number++],lval);
//printf("%s\n",lval);
				strcat(fcall, lval);
				break;
			case 'U':
				sprintf(fcall,"Line %d: %s = Call ", lineno++, lval);
				break;

			default:
				printf("Error: it's here at the left section Unknown node type: %c\n", a->nodetype);
				break;
		}

	}
	if (a->r) {

		if(a->nodetype=='J')
		{
		fprintf(fp_out,"Line %d: Label %d:\n",lineno++, label-2);
		
		}

		if(a->nodetype == 'V')
			{
			in_main = 0;
			procedure[proccount] = (struct sym_table*) malloc(sizeof(struct sym_table));
			procedure[proccount]->size=0;
			procedure[proccount]->max_size=32;
			procedure[proccount]->entries = (struct sym_table_entry*) malloc(procedure[proccount]->max_size*sizeof(struct sym_table_entry));
			proccount++;
			}

		rval = eval(a->r);


		switch (a->nodetype)
		{
			case '=':
				gencode(rval);	
				if (a->r->nodetype=='S')
					{
					is_valid_rvalue(rval);
					if(in_main==0)
						procedure_is_valid_rvalue(rval);
					}
				if(a->r->nodetype == 'S' || a->r->nodetype == 'K' || a->r->nodetype == 'F' || a->r->nodetype == 'Z' )
				strcat(lval, rval);
				else
				strcat(lval, tempvars[tempvarindex-1]);
				
				val = lval;
				break;
			case '+':
			case '-':
			case '*':
			case '/':
			case '%':
			case '&':
			case '|':
			case '!':
			case '<':
			case '>':
			case 'B':
			case 'C':
			case 'G':
			case 'H':
				if(a->r->nodetype == 'S')
					{
					is_valid_rvalue(rval);
					if(in_main==0)
						procedure_is_valid_rvalue(rval);
					}
				strcat(lval,rval);
				sprintf(tmpstr,"%c", a->nodetype);
				strcat(lval,tmpstr);
				
				return lval;
				break;

			case 'I':
			case 'A':
			case 'P':
				break;

			case 'T':
				break;
			case 'Q':				
				break;
			case 'O':				
				if (parent == 1)
				fprintf(fp_out,"Line %d: goto Label 3: \n",lineno++);
				parent = 0;
				fprintf(fp_out,"Line %d: Label 1:\n",lineno++);
				break;
			case 'Y':
				break;
			case 'J':				
				fprintf(fp_out,"Line %d: Label %d:\n",lineno++, count*3);
				count--;
				break;
			case 'E':
				CPRINT_WR(lineno, rval);
				if(funcp_write == 1)
					{
					fprintf(fp_out,"Line %d: param = %s \n",lineno++, rval);

					//********INCOMLETE***********SYMBOL TABLE CHANGING MAY CAUSE TROUBLE LATER WHEN CODING
					int x = check_table(rval);
					
					sprintf(temp_variable, "%d", st->entries[x].type    );
					strcat(procedure_compare[procp_compare_number-1],temp_variable);
					count_para++;
					}
				else
				fprintf(fp_out,"Line %d: write %s\n",lineno++, rval);
				return; // return so we don't print an extra "write" statement
			case '1':
				
				break;
			case '2':
			case '3':
			case '4':
			case '5':
			case '6':
				break;
			case '7':
				is_valid_procname(rval);
				strcat(lval, "Call ");
				strcat(lval, rval);
				strcat(lval, "(), 0");
				val = lval;
				break;
			case 'V':
				
			case '@':
				break;	
			case '^':
				break;	
			case '~':
				break;
			case '[':
				break;
			case '(':
				break;
			case ')':
				break;
			case '_':
				break;
			case ']':
				break;
			case '9':
				break;
			case ':':
				break;
			case '.':
				break;
			case ',':
				break;
			case ';':
				break;
			case '$':
				break;
			case '#':
				break;
			case '?':
				funcp_write = 1;
				fprintf(fp_out,"%s",fcall);

				fprintf(fp_out,", %d\n",count_para);
				funcp_write = 0;
				break;
			case 'U':
				{
				int i;
				int result = -1;
				for(i=0;i<procp_number;i++)
					{
					if (strcmp(procedure_compare[procp_compare_number-1], procedure_names[i]) == 0)	
						{result = 0;
						break;
						}
					}
				if(result !=0)
					yyerror("Function Call do not match\n");
				}
				break;

			default:
				printf("Error: it's here at the right section Unknown node type: %c\n", a->nodetype);
				break;
		}

	}
	
	// Only for non-literal or non-identifier nodes
	switch (a->nodetype)
	{
		case 'R':
			lineno = print_read_input_idents(lineno);	
			
			break;
		case '$':
		case 'N':
			lineno = print_read_integer_idents(lineno);	
			
			break;
		case ';':
		case 'D':
			lineno = print_read_float_idents(lineno);				
			break;
		case '#':
		case 'L':
			lineno = print_read_string_idents(lineno);	
			
			break;

		case 'W':	
			
			break;	
		case '=':
			CPRINT_ASSIGN(lineno, val);
			if(funcp_write == 1)
				count_para++; 
			fprintf(fp_out,"Line %d: %s\n",lineno++, val);
			break;
		case 'A':

		case 'P':
			break;
		case '+':
		case '-':
		case '*':
		case '/':
		case '%':
		case '|':
		case '&':
		case '!':
		case 'B':
		case 'C':
		case 'G':
		case 'H':
		case '<':
		case '>':
		case 'J':	
			break;
		case 'T':
		case 'Q':
		case 'O':
		case 'Y':
			break;
		case 'I':
			break;
		case 'E':
			CPRINT_WR(lineno, lval);
			if(funcp_write == 1)
				{
				int x = check_table(lval);
				sprintf(temp_variable, "%d", st->entries[x].type    );
				strcat(procedure_compare[procp_compare_number-1],temp_variable);
	
				//sprintf(procedure_compare[procp_compare_number-1], "%d", st->entries[x].type    );			
				count_para++;
				fprintf(fp_out,"Line %d: param = %s \n",lineno++, lval);
				}
				
			else
			fprintf(fp_out,"Line %d: write %s\n",lineno++, lval);
			return lval;
		case '1':
		case '2':
		case '3':
		case '4':
		case '5':
		case '6':
			break;
		case '7':
			CPRINT_ASSIGN(lineno, val);
			fprintf(fp_out,"Line %d: %s\n",lineno++, val);
			break;
		case '8':
			break;
		case 'V':
		case '@':
			break;	
		case '^':
			break;
		case '~':
			break;
		case '[':
			break;
		case '(':
			break;
		case ')':
			break;
		case '_':
			break;
		case ']':
			break;
		case '9':
			break;
		case ':':
			break;
		case '.':
			break;
		case ',':
			break;

		case '?':
			break;
		case 'U':
			break;

		default:
			printf("Error: it's here at the last section Unknown node type: %c\n", a->nodetype);
			return;
	}
}

main(int argc, char **argv)
{
	int i;
	st = (struct sym_table*) malloc(sizeof(struct sym_table));
	
	FILE *f;
	procindex = 0;
	fp_out = fopen("tmp.3adr","w");
	struct sym_table procedure[10];
	st->size = 0;
	st->max_size = 32;
	st->entries = (struct sym_table_entry*) malloc(st->max_size*sizeof(struct sym_table_entry));	
	proccount = 0;	
	identqueuehead = NULL;
	reading_ident_list = 0;
	reading_integer_list = 0;
	reading_float_list = 0;
	reading_string_list = 0;
	tempvarindex = 0;
	generate_temp = 0;
	yyparse();	
	if (proc_used == 1)
	procedure_show_symbol_table();
	else
	show_symbol_table();	
	//printf("%s\n",procedure_compare[procp_compare_number-1]);
	/* Clean up the symbol table(s) */
	free(st->entries);
	free(st);
	fclose(fp_out);	
}
