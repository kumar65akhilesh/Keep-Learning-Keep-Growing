/*
 * Declarations for micro compiler
 */
//#include "microdefs.h"
typedef char TEMP_NAME[4];

enum data_types { INT, FLOAT, STRING };

struct sym_table_entry {
	char ident[32];
	int defined;
	enum data_types type; /* For later use */
};

struct sym_table {
	struct sym_table_entry *entries;
	int size;
	int max_size;
	struct sym_table *parent; /* Used when we introduce scoping? */
};


struct ast {
	int nodetype;
	struct ast *l;
	struct ast *r;
	int flag;
	char *value;
};

struct numval {
	int nodetype;
	char number[20]; /* Only need string, no actual computation is done here */
};

struct floatval {
	int nodetype;
	char number[20]; /* Only need string, no actual computation is done here */
};

struct stringval {
	int nodetype;
	char number[20]; /* Only need string, no actual computation is done here */
};

struct identval {
	int nodetype;
	char ident[32];
	int functionno; // function numbers for the labels
};


struct identqueuenode {
	struct identqueuenode *next;
	char *ident;
};

extern int yylineno; /* from lexer */
//extern struct sym_table *st;
 
void yyerror(char *s, ...);

struct ast *newast(int nodetype, struct ast *l, struct ast *r);
struct ast *newnum(int d);
struct ast  *newident(char *s);
struct ast *newfloat(float d);
struct ast *newstring(char *s);

