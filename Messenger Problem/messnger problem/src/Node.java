
import java.util.ArrayList;
import java.util.Comparator;

public class Node  {

	public int row,col,depth;
	public double cost;
	public Node parent;
	public String path;
	public ArrayList<Integer> package_delivered=new ArrayList<Integer>();
	public Node(int r, int c,int dep,double cos,Node Parent,ArrayList<Integer> G,String direction)
	{
		row = r;
		col = c;
		depth=dep;
		cost=cos;
		parent=Parent;
		path=direction;
		package_delivered=G;
	}
	public String toString()
	{
		return("Cost: "+ cost + "," + "Path: "  + path);
	}
	public static class DFSComparator implements Comparator<Node> {
		public int compare(Node a, Node b)
		{
			return b.depth-a.depth;
		}
	}
	public static class UCSComparator implements Comparator<Node> {
		public int compare(Node a, Node b)
		{
			return (int) ((int) (a.cost) - (b.cost));
		}
	}
	public static class ColComparator implements Comparator<Node> {
		public int compare(Node a, Node b)
		{
			return 1;
		}
	}
	
}