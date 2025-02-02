import java.util.*;


public class QuickSort {

	/**
	 * @param args
	 */
	public static int[] swap(int[] a, int pos1, int pos2){
		int temp = a[pos1];
		a[pos1] = a[pos2];
		a[pos2] = temp;
		return a;
	}

	public static void main(String[] args) {
		// TODO Auto-generated method stub
		int a[] = { 1, 4, 5, 6, 15, 19, 34, 9, 3, 5, 9, 13, 10 };
		a = quickSort(a);
		for (int i=0; i<a.length; i++){
			System.out.print(a[i] + " ");
		}

	}

	private static int[] quickSort(int[] a) {
		// TODO Auto-generated method stub
		if(a.length <= 1)
			return a;
		int pivot = a[a.length-1];
		int[] less = lesslist( a, pivot);
		int[] greater = greaterList(a,pivot);		
		//quickSort(greater);
		a = concatenate(quickSort(less), pivot, quickSort(greater));
		return a;
	}

	private static int[] concatenate(int[] less, int pivot, int[] greater) {
		// TODO Auto-generated method stub
		int [] a = new int[less.length + greater.length + 1];
		int loc = 0;
		for (int i = 0; i < less.length; i++ ) {
			a[loc++] = less[i];
		}
		a[loc++] = pivot;
		for ( int i = 0 ; i < greater.length; i++) { 
			a[loc++] = greater[i];
		}
		return a; 
	}

	private static int[] lesslist(int[] a, int pivot) {
		// TODO Auto-generated method stub
		int[] b = new int[a.length];
		int loc = 0;
		for(int i = 0; i < a.length-1; i++) {
			if(a[i] <= pivot){
				b[loc++] = (a[i]);
			}
		}
		int[] c = new int[loc];
		for(int i = 0; i < loc; i++) {
			c[i] = b[i];
		}
		return c;
	}
	
	private static int[] greaterList(int[] a, int pivot) {
		// TODO Auto-generated method stub
		int b[] = new int[a.length];
		int loc = 0;
		for(int i = 0; i < a.length-1; i++) {
			if(a[i] > pivot){
				b[loc++] = a[i];
			}
		}
		int[] c = new int[loc];
		for(int i = 0; i < loc; i++) {
			c[i] = b[i];
		}
		return c;
	}

}
