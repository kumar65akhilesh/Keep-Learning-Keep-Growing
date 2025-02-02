
import java.io.BufferedInputStream;
import java.io.BufferedReader;
import java.io.DataInputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStreamReader;
import java.util.ArrayList;


public class Read {
	
	public static void readFile(){
		try{
			int i=0;
			File file=new File("map3.txt");
			FileInputStream fileRead=new FileInputStream(file);
			BufferedInputStream bis=new BufferedInputStream(fileRead);
			BufferedReader br= new BufferedReader(new InputStreamReader(bis));
			String line=br.readLine();
			line=line.trim();
			String temp[]=line.split(" ");
			row=Integer.parseInt(temp[0]);
			BFS.setMax_Row(row-1);			
			DFS.setMax_Row(row-1);
			UCS.setMax_Row(row-1);
			Recursion.setMax_Row(row-1);

			col=Integer.parseInt(temp[1]);
			BFS.setMax_Col(col-1);
			DFS.setMax_Col(col-1);
			UCS.setMax_Col(col-1);
			Recursion.setMax_Col(col-1);
			line=br.readLine();
			line=line.trim();
			temp=line.split(" ");
			int startx=Integer.parseInt(temp[0]);
			BFS.setStart_row(startx);
			DFS.setStart_row(startx);
			UCS.setStart_row(startx);
			Recursion.setStart_row(startx);
			int starty=Integer.parseInt(temp[1]);
			BFS.setStart_col(starty);
			DFS.setStart_col(starty);
			UCS.setStart_col(starty);
			Recursion.setStart_col(starty);
			int j=i=0;
			while(i<row)
			{
				
				line=br.readLine();
				char var[]=line.toCharArray();
				for(int k=0;k<col;k++){
					
					Grid[i][k]=var[k];
				if(var[k]!='.'){
					packages.add(j);
					
					j++;
				}
			}
				i++;
			}
			goal_size=packages.size();
			
			BFS.setGrid(Grid);
			DFS.setGrid(Grid);
			UCS.setGrid(Grid);
			Recursion.setGrid(Grid);
			BFS.setGoals(packages);
			DFS.setGoals(packages);
			UCS.setGoals(packages);
			Recursion.setGoals(packages);
			getpos();
			i=0;
			while(i<row)
			{
				line=br.readLine();
				line=line.trim();
				temp=line.split(" +");
				for(j=0;j<col;j++){
					cost_grid[i][j]=Double.parseDouble(temp[j]);
					}
				i++;
			}
			BFS.setMap_cost(cost_grid);
			DFS.setMap_cost(cost_grid);
			UCS.setMap_cost(cost_grid);
			Recursion.setMap_cost(cost_grid);
		}catch(IOException e)
		{
			
		}
		}

		private static void getpos() {
			int k=0;
			for(int i=0;i<row;i++)
			{
				for(int j=0;j<col;j++){
					int change_row=0;
				if(Grid[i][j]!='.')
				{
					Goal_position[k][change_row]=i;
					Goal_position[k][change_row+1]=j;
					k++;
				}
				}
			}
			BFS.setGoal_pos(Goal_position);
			DFS.setGoal_pos(Goal_position);
			UCS.setGoal_pos(Goal_position);
			Recursion.setGoal_pos(Goal_position);
		}
		private static int row,col;
		private static int goal_size=0;
		private static int Goal_position[][]=new int[25][2];
		private static char Grid[][]=new char[30][30];
		private static ArrayList<Integer> packages=new ArrayList<Integer>();
		private static double cost_grid[][]=new double[20][20];
	}
