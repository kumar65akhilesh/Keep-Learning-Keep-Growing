
public class binarySearch {

	public static void main(String[] args) {
		// TODO Auto-generated method stub
		int a[] = new int[50];
		for (int i = 0; i<50; i++){
			a[i] = i*2;

		}
		bSearch(a, 98, 0, 49);

	}
	/* 
	 * @param a : array in which binary search is to done
	 * @param b: element to be found
	 * @param start: start index of the array
	 * @param end: end index of the array
	 * output: found or not found
	 */
	private static void bSearch(int[] a,int b, int start, int end) {
		// TODO Auto-generated method stub
		int mid = (start + end)/2;
		if ( a[mid] == b) {
			System.out.println("found");
			return;
		}
		if(end < start){
			System.out.println("not found");
			return;
		}
		if (b < a[mid]) {
			end = mid-1;
		}
		else {
			start = mid + 1;
		}
		bSearch(a, b, start, end);
	}

}
