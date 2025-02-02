import java.io.BufferedReader;
import java.io.File;
import java.io.FileNotFoundException;
import java.io.FileOutputStream;
import java.io.FileReader;
import java.io.IOException;
import java.security.Key;
import java.security.NoSuchAlgorithmException;
import java.security.NoSuchProviderException;
import java.security.SecureRandom;
import java.util.Scanner;
import java.util.StringTokenizer;
import javax.crypto.*;
import javax.crypto.spec.SecretKeySpec;
import sun.misc.*;

/*
 * Searching is case sensitive.
 * The search is made for exact match. If the word ends with '.' then to word also must end with '.'.
 * AES encryption scheme is used. 
 * ECB mode of operation is used by the AES.
 * Assumption: This may not work for files that have words larger than length 20. We assumed that most of the common English words
 * are smaller than 20. 
 * BASE64Encoder().encode(encVal) may give an error in eclipse. To remove the error go to WINDOW----> Preferences ----> Java ------>Compiler
 * ------>Error/Warnings -------> Deprecated and Restricted API -----> change Forbidden References to Warning.
 */

public class PracticalSearchTechnique {
	private static final String[] file_name = {"test0.txt", "test1.txt", "test2.txt", "test3.txt"};//File name can be specified here
	private static String queryWord = "the";	//The search word can be changed here
	private static final String ALGO = "AES";
    private static byte[] keyValue =  new byte[] { 'P', 'e', 'r', 'f', 'e', 'c', 't', 'S', 'e', 'c', 'r','e', 't', 'K', 'e', 'y' }; 	
	private static int noOfWords;
	private static String paddedMessage ;
	private static byte[][] allKey;//stores stream keys for scheme 1, scheme2 and scheme3
	private static byte[][] streamKey;//stream keys for scheme 4
	private static String display_encrypted;
	
	private static byte[] scheme4_randomSeed = "arandomseedoftwentytwo".getBytes();
	
	
	//encrypt using AES
	
	public static String encryptAES(String Data) throws Exception {
        Key key = generateKeyAES();
        Cipher c = Cipher.getInstance(ALGO);
        c.init(Cipher.ENCRYPT_MODE, key);
        byte[] encVal = c.doFinal(Data.getBytes());
        String encryptedValue = new BASE64Encoder().encode(encVal);
        return encryptedValue;
    }

    public static String decryptAES(String encryptedData) throws Exception {
        Key key = generateKeyAES();
        Cipher c = Cipher.getInstance(ALGO);
        c.init(Cipher.DECRYPT_MODE, key);
        byte[] decordedValue = new BASE64Decoder().decodeBuffer(encryptedData);
        byte[] decValue = c.doFinal(decordedValue);
        String decryptedValue = new String(decValue);
        return decryptedValue;
    }

	
	//Generating key for AES
	
	 private static Key generateKeyAES() throws Exception {
		 	
	        Key key = new SecretKeySpec(keyValue, ALGO);
	        return key;
	}
	
	/*
	 * Function to count the number of word in the message file
	 * 
	 */
	
	public static void wordCount(File file) throws IOException
	{
		BufferedReader br = new BufferedReader(new FileReader(file));  
		String line = "", str = "";
		int count = 0;
		while ((line = br.readLine()) != null) {
			str += line + " ";                }    
		StringTokenizer st = new StringTokenizer(str);
		while (st.hasMoreTokens()) { 
			st.nextToken();  
			count++;                }  
		noOfWords = count;
			
	}
	/*
	 * Returns the first half of the give byte array
	 */
	public static byte[] firstHalf(byte[] data)
	{
		int len = data.length;
		byte[] firsthalf = new byte[len/2];
		for(int i=0; i<len/2; i++)
		{
			firsthalf[i] = data[i];
		}
		return firsthalf;
	}
	/*
	 * Returns the second half of the given byte array
	 */
	public static byte[] secondHalf(byte[] data)
	{
		int len = data.length;
		byte[] secondhalf = new byte[len/2];
		for(int i=len/2; i<len; i++)
		{
			secondhalf[i-len/2] = data[i];
		}
		return secondhalf;
		
	}
	/*
	 * takes a byte array as input and returns the binary representation of the byte array
	 */
	static String toBinary( byte[] bytes )
	{
	    StringBuilder sb = new StringBuilder(bytes.length * Byte.SIZE);
	    for( int i = 0; i < Byte.SIZE * bytes.length; i++ )
	        sb.append((bytes[i / Byte.SIZE] << i % Byte.SIZE & 0x80) == 0 ? '0' : '1');	  
	    return sb.toString();
	}
	
	/*
	 * pseudorandom function
	 * takes a key .
	 * takes any value
	 * generate random as discussed in the section 6.5 of book.
	 */
	
	public static byte[] pseudoRandomFunction(byte[] data, byte[] key)
	{
		//just reading each bit of the byte
		byte[] bytes = new byte[key.length*2];
		
		try {
		SecureRandom rand = SecureRandom.getInstance("SHA1PRNG", "SUN");
		
		rand.setSeed(key);
		
		rand.nextBytes(bytes);
		
		String binaryString = toBinary(data);
		
		for(int i = 0; i < binaryString.length(); i++)
		{
			
			if(binaryString.charAt(i) == '0')
			{
				
				rand.setSeed(firstHalf(bytes));
				rand.nextBytes(bytes);
				
				
			}
			else
			{
				
				rand.setSeed(secondHalf(bytes));
				rand.nextBytes(bytes);			
				
			}
		}
		
		if(binaryString.charAt(binaryString.length()-1) == '0')
			bytes = firstHalf(bytes);
		else
			bytes = secondHalf(bytes);
		} catch (NoSuchAlgorithmException e) {
						e.printStackTrace();
		}
		catch(NoSuchProviderException e1)
		{
			e1.printStackTrace();
		}
		
		
		return bytes;
	}
	
	/*
	 * Encrypts a message with a given key
	 */
	
	public static byte[] encrypt(String word, byte[] key)
	{
		byte[] messageByte = word.getBytes();
		byte[] cipherWord = new byte[messageByte.length] ;
		
		for(int i = 0; i < messageByte.length; i++)
		{
			cipherWord[i] = (byte) (messageByte[i] ^ key[i]);
		}
		
		return cipherWord;
	}
	
	/*
	 * Decrypts the message with a given Key
	 */
	
	public static byte[] decrypt(byte[] cipher, byte[] key)
	{
		byte[] messageByte = new byte[cipher.length];
		
		
		for(int i = 0; i < cipher.length; i++)
		{
			messageByte[i] = (byte) (cipher[i] ^ key[i]);
		}
		
		return messageByte;
	}
	
	/*
	 * this function generates each Si(mentioned in the scheme 1) values using stream cipher
	 * param 2: message is the padded message
	 * key is key used to generate the stream cipher for the padded message
	 */
	
	public static void  genKey(byte[] key, byte[] messageBytes)
	{
		SecureRandom rand = new SecureRandom();
		
		byte[] bytes = new byte[messageBytes.length/2];
		
		rand.setSeed(key);
		
		rand.nextBytes(bytes);		
		
		allKey = new byte[noOfWords][10];
				
		for(int i=0; i<noOfWords; i++)
		{
			byte[] stream = new byte[10];
			for(int j = 0; j < 10; j++)
				{
				stream[j] = bytes[i*10 +j];
				
				}
			allKey[i] = stream;
			
		}
		System.out.println();
		
	}
	/*
	 * generates the sequence of pseudorandom values 
	 */
	
	public static void  genStream(byte[] key, byte[] messageBytes)
	{
		SecureRandom rand = new SecureRandom();
		
		byte[] bytes = new byte[messageBytes.length*2];
		
		rand.setSeed(key);
		
		rand.nextBytes(bytes);		
		
		streamKey = new byte[noOfWords][22];
				
		for(int i=0; i<noOfWords; i++)
		{
			byte[] stream = new byte[22];
			for(int j = 0; j < 22; j++)
				{
				stream[j] = bytes[i*22 +j];
				
				}
			streamKey[i] = stream;
		}

		
	}
	
	
	/*
	 * Reads a given file
	 * takes file as an argument
	 * breaks the word file in different words and pads each word to make it fixed length word.
	 * saves the output in paddedMessage
	 * each word should be less than length 20 
	 */
	
	public static void readFile(File file)
	{
		BufferedReader br = null;
	
		try {
			 
			String sCurrentLine;
			paddedMessage = "";
			br = new BufferedReader(new FileReader(file));
 
			while ((sCurrentLine = br.readLine()) != null) 
			{
				String[] words = sCurrentLine.split(" ");
				
				for(int i=0; i<words.length; i++)
				{
					int length = words[i].length();
					
					for(int j=length;j<20;j++)
					{
						words[i] = words[i].concat("z");
						
					}
					paddedMessage = paddedMessage.concat(words[i]);
				}
				
			}
			
			
			//byte[] fixedMessage = paddedMessage.getBytes();
			//writeFile(new File("paddedText.txt"), fixedMessage);
 
		} catch (IOException e) {
			e.printStackTrace();
		} finally {
			try {
				if (br != null)br.close();
			} catch (IOException ex) {
				ex.printStackTrace();
			}
		}

	}
	
	/*
	 * this functions writes given data bytes to a file
	 */
	
	public static void writeFile(File file, byte[] data)
	{
		try{
			
			FileOutputStream fos = new FileOutputStream(file);
			fos.write(data);
			fos.close();
		}
		catch(FileNotFoundException e)
		{
			System.out.println("File not found " + e);
		} catch (IOException e) {
			System.out.println("Something is wrong with the I/O  file");
		}
	}
	
	
	public static void main(String args[])
	
	 
	{
		System.out.println("4 demo files have been created and located assignment2 folder. You may change the contents of the test files but not the file name ");
		Scanner scan = new Scanner(System.in);
		System.out.println("Please enter the key for encryption: ");		
		String temp_keyValue = scan.nextLine();
		System.out.println("Please enter the word that you want to search in the encrypted document (for e.g. \"the\"): ");
		
		//Scanner scan = new Scanner(System.in);
		queryWord = scan.nextLine();
		
		SecureRandom rand = new SecureRandom();		
		byte[] bytes = new byte[16];		
		rand.setSeed(temp_keyValue.getBytes());		
		rand.nextBytes(bytes);	
		
		
		keyValue = bytes;
		for(int z=0; z<file_name.length; z++)
		{	
		System.out.println("\n-------------------FILE NUMBER " + (z+1) + "--------------------------------");
		
		String q = Integer.toString(z);
		String name_file = ("test".concat(q)).concat(".txt");
		File file = new File(name_file);
		try {
			wordCount(file);
		} catch (IOException e) {
			
			e.printStackTrace();
		}
		readFile(file);
	
		String[] words = new String[noOfWords];
		
		for(int i = 0; i<noOfWords; i++)
		{
			words[i] = paddedMessage.substring(i*20, i*20+20);
			//System.out.println(words[i]);
		}
				
					
		//----------SCHEME 4 FINAL SCHEME------------------------------------------>
		
		//encrypting the file.
		
		byte[][] ciphertext4 = encrypt_final(words, z); // encrypts the file and stores it in file named encrypte_final.txt
		
		//encryting the serach word
		String searchword4 = queryWord;	
		String encrypt_searchword4 = "";
		int leng = searchword4.length();	
		
		for(int i=leng; i<20; i++)
			searchword4 = searchword4.concat("z");
			
		try {
			encrypt_searchword4 = encryptAES(searchword4);
			display_encrypted = encrypt_searchword4;
		} catch (Exception e) {
			e.printStackTrace();
		}
		
		//searching the encrypted word in the encrypted file
		
		search_final(encrypt_searchword4, ciphertext4);
		
		
			
		
					
		//----------X---------------------X------------------------X-----------------
		
	}
		System.out.println("Encrpyted search word was: " + display_encrypted);
		System.out.println("Encrypted Files are written in the default folder(Assignment2)");
		
	}
	
	
	
	
	/*
	 * param 1: it is the searchword 
	 */
	
	

	private static void search_final(String encrypt_searchword4, byte[][] ciphertext4) {
		// TODO Auto-generated method stub
		//------the process of searching of any word in the encrypted message.-------
		
		boolean nomatch = true;	
		
		
		byte[][] lefthalf = new byte[noOfWords][streamKey[0].length];
		
		for(int i = 0; i < noOfWords; i++)
		{
			for(int j = 0; j < streamKey[0].length; j++)
			{
				lefthalf[i][j] = (byte) (streamKey[i][j] ^ ciphertext4[i][j]);
			}
		}
		
		
		
	//compute the corresponding k_i by using the pseudorandom function
		
		byte[][] decryptkey4 = new byte[noOfWords][lefthalf[0].length];
		byte[][] right_decrypthalf = new byte[noOfWords][lefthalf[0].length];
		
							
		for(int i= 0; i<noOfWords; i++)
		{
			for(int j=0; j<lefthalf[0].length; j++)
			{
				decryptkey4[i] = pseudoRandomFunction(lefthalf[i], scheme4_randomSeed);
			}
		}
		
		//with this k_i compute f_ki(S_i)
		
		for(int i= 0; i<noOfWords; i++)
		{
			for(int j=0; j<lefthalf[0].length; j++)
			{
				right_decrypthalf[i] = pseudoRandomFunction(streamKey[i], decryptkey4[i]);
			}
		}
		
		
		
	//compute the key for the left half.
						
							
	// compute the s_i || F_ki_(S_i)				
		
		
		byte[][] match_s_F = new byte[noOfWords][streamKey[0].length + right_decrypthalf[0].length];
		
		for(int i = 0; i<noOfWords; i++)
		{
			for(int j=0; j<streamKey[0].length; j++)
			{
				match_s_F[i][j] = streamKey[i][j];
				
			}
			for(int j=0; j<right_decrypthalf[0].length; j++)
			{
				match_s_F[i][j+streamKey[0].length] = right_decrypthalf[i][j];
				
			}
			
		}
		
		//find the encrypted word by XOring S_i || F_Ki(S_i) and cipher .
		
		byte[][] expectedMatchWords = new byte[noOfWords][match_s_F[0].length];					
		for(int i = 0; i< noOfWords; i++)
		{
			for(int j = 0; j < match_s_F[0].length; j++)
			{
				expectedMatchWords[i][j] = (byte) (ciphertext4[i][j] ^ match_s_F[i][j]);							
			}									
			
		}
		
		for(int i=0; i<noOfWords; i++)
		{
			boolean flag = true;
			for(int j=0; j<expectedMatchWords[0].length; j++)
			{
				
				if(expectedMatchWords[i][j] != encrypt_searchword4.getBytes()[j])
				 	flag = false;
			}
			if(flag)
				{
				nomatch = false;
				System.out.println("With Scheme 4 Match found at location " + (i+1));
				}
			
		}
			
		if(nomatch)
			System.out.println("The word is not present in this text document");
		
		
	}


	
	private static byte[][] encrypt_final(String[] words, int fileNo) {
		
		
		String[] encrypted_words = new String[noOfWords];
		String[] first_half = new String[noOfWords];
		String[] second_half = new String[noOfWords];
		byte[] random_seed4 = "randomkey_scheme".getBytes();
		byte[][] scheme4_keys_func = new byte[noOfWords][22];
		byte[][] rightpart = new byte[noOfWords][22];
		
		
		//Compute Xi for all the words.		
		for(int i=0; i<noOfWords; i++)
		{
			try
			{							
				encrypted_words[i] = encryptAES(words[i]);							
			}
			catch (Exception e) 
			{							
						e.printStackTrace();
			}						
		}			
							
							
							
		for(int i = 0; i<noOfWords; i++)
		{
			first_half[i] = encrypted_words[i].substring(0, encrypted_words[i].length()/2);
			second_half[i] = encrypted_words[i].substring(encrypted_words[i].length()/2);						
		}
							
		//Generating stream cipher for scheme 4
				
					
		genStream(random_seed4, paddedMessage.getBytes());
							
		//generating keys with left half of the encrypted words
							
							
		for(int i = 0; i<noOfWords; i++)
		{
			scheme4_keys_func[i] = pseudoRandomFunction(first_half[i].getBytes(), scheme4_randomSeed);
		}
							
							
							
		//generating the second half of the ciphertext using the above two parts
							
							
		for(int i = 0; i<noOfWords; i++)
		{
			rightpart[i] = pseudoRandomFunction(streamKey[i], scheme4_keys_func[i]);
		}
							
											
		//generating the ciphertext for the server
							
		byte[][] ciphertext4 = new byte[noOfWords][streamKey[0].length + rightpart[0].length];
		byte[] encry_scheme4 = new byte[noOfWords * (streamKey[0].length + rightpart[0].length)];
		for(int i = 0; i<noOfWords; i++)
		{
			for(int j=0; j<streamKey[0].length; j++)
			{
				ciphertext4[i][j] = (byte) (streamKey[i][j] ^ first_half[i].getBytes()[j]);
				encry_scheme4[i*(streamKey[0].length + rightpart[0].length)+j] = ciphertext4[i][j];
			}
			for(int j=0; j<rightpart[0].length; j++)
			{
				ciphertext4[i][j+streamKey[0].length] = (byte) (rightpart[i][j] ^ second_half[i].getBytes()[j]);
				encry_scheme4[i*(streamKey[0].length + rightpart[0].length)+j] = ciphertext4[i][j+streamKey[0].length];
			}						
		}
		String num = Integer.toString(fileNo);					
		File enc4 = new File(("EncryptedTestFile_".concat(num)).concat(".txt"));
		writeFile(enc4, encry_scheme4);
		return ciphertext4;							
		
	}

}
