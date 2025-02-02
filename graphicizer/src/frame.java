/* Frame 1 */ 

import javax.swing.*; 
import javax.swing.JMenuBar; 
import javax.swing.JMenu; 
import javax.swing.Action; 
import javax.swing.AbstractAction; 
import javax.swing.KeyStroke; 
import java.awt.event.InputEvent.*; 
import java.awt.event.*; 
import java.awt.image.*; 
import javax.imageio.*; 
import java.awt.*; 
import java.lang.Math; 
import java.io.*; 
import java.awt.color.ColorSpace; 

public class frame extends JFrame implements ActionListener, MouseListener, MouseMotionListener{ 


	opr  o=new opr(); 
	FileDialog dialog; 
	Color cl=new Color(200,255,0); 
	Color c; 
	JDesktopPane jdpane; 
	JPanel panel; 
	String save; 
	Point dot[] = new Point[1000]; 
	Point start, end; 
	boolean mouseUp = false; 
	boolean draw = false; 
	boolean line = false; 
	int n=0,dots=0; 
	JButton bLine = new JButton("Draw lines"); 
	frame(){ 
		super("Image Editing Tool"); 


		panel=new JPanel(){              public void paintComponent(Graphics g) 
		{   
			super.paintComponent(g); 
			if(c!=null) setBackground(c); 

			if(filteredImage!=null) 
				g.drawImage(filteredImage,0,0,null); 
			else{ 
				if(originalImage!=null) 
					g.drawImage(originalImage,0,0,null); 
			} 


		} 

		}; 

		//jdpane=new JDesktopPane() 
		// add(panel); 
		panel.setLayout(new FlowLayout()); 
		panel.setBackground(cl); 
		setDefaultCloseOperation(JFrame.EXIT_ON_CLOSE); 
		setSize(1024,768); 
		getContentPane().add(panel); 

		toolbar=new JToolBar(); 
		getContentPane().add(toolbar,BorderLayout.NORTH); 
		toolbar.setLayout(new FlowLayout()); 
		toolbar.setFloatable(false); 

		JButton newButton=new JButton(new ImageIcon("images/new.png")); 
		JButton openButton=new JButton(new ImageIcon("images/open.png")); 
		JButton saveButton=new JButton(new ImageIcon("images/save.png")); 
		JButton colorButton=new JButton(new ImageIcon("images/color.png")); 
		final JButton undoButton=new JButton(new ImageIcon("images/undo.png")); 
		JButton redoButton=new JButton(new ImageIcon("images/redo.png")); 

		newButton.setBorder(BorderFactory.createRaisedBevelBorder()); 
		openButton.setBorder(BorderFactory.createRaisedBevelBorder()); 
		saveButton.setBorder(BorderFactory.createRaisedBevelBorder()); 
		colorButton.setBorder(BorderFactory.createRaisedBevelBorder()); 
		undoButton.setBorder(BorderFactory.createRaisedBevelBorder()); 
		redoButton.setBorder(BorderFactory.createRaisedBevelBorder()); 
		toolbar.add(newButton); 
		toolbar.add(openButton); 
		toolbar.add(saveButton); 
		toolbar.addSeparator(); 
		toolbar.add(undoButton); 
		toolbar.add(redoButton); 
		toolbar.addSeparator(); 
		toolbar.add(colorButton); 
		undoButton.setEnabled(false); 
		/* NEW BUTTON ACTION OF TOOLBAR */ 
		newButton.addActionListener(new ActionListener() 
		{              public  void actionPerformed(ActionEvent event) 
		{               originalImage=null; 
		repaint(); 

		}}); 

		/* OPEN BUTTON OF TOOLBAR */                                            
		openButton.addActionListener(new 
				ActionListener() 
		{              public void actionPerformed(ActionEvent event) 
		{              openFile(); 
		}}); 

		/* SAVE BUTTON ACTION OF TOOLBAR */                            
		saveButton.addActionListener(new 
				ActionListener() 
		{              public void actionPerformed(ActionEvent event) 
		{              
			try 
			{ 
				save=JOptionPane.showInputDialog("ENTER THE PATH WHERE THE FILE NEEDS TO BE SAVED"); 
				saveImage(filteredImage,save); 

			} 
			catch(Exception e) 
			{              System.out.println("ERROR IN SAVING THE FILE"); 
			}    
		} 
		}); 

		/* UNDO BUTTON ACTION OF TOOLBAR */                            
		undoButton.addActionListener(new 
				ActionListener() 
		{              public void actionPerformed(ActionEvent event) 
		{              filteredImage=o.undo(); 
		image=filteredImage; 
		repaint(); 
		} 
		}); 
		/* REDO BUTTON ACTION OF TOOLBAR */                            
		redoButton.addActionListener(new 
				ActionListener() 
		{              public void actionPerformed(ActionEvent event) 
		{ filteredImage=o.redo(); 
		image=filteredImage; 
		repaint(); 

		} 
		}); 
		colorButton.addActionListener(new 
				ActionListener() 
		{              public void actionPerformed(ActionEvent event) 
		{ c=JColorChooser.showDialog(frame.this,"Select a new color",Color.white); 
		} 
		});                             

		bar=new JMenuBar(); 
		setJMenuBar(bar); 

		JMenu fileMenu=new JMenu("File"); 
		JMenu editMenu=new JMenu("Edit"); 
		JMenu viewMenu=new JMenu("View"); 
		JMenu filterMenu=new JMenu("Filter"); 
		JMenu colorMenu=new JMenu("Color"); 
		JMenu adjustMenu=new JMenu("Adjustments"); 
		fileMenu.setMnemonic('F');              // shortcuts for menu 
		editMenu.setMnemonic('E'); 
		viewMenu.setMnemonic('V'); 
		filterMenu.setMnemonic('F'); 
		colorMenu.setMnemonic('C'); 
		adjustMenu.setMnemonic('A'); 

		/*FILEMENU ITEMS ACTION */ 
		newItem = fileMenu.add("New"); 
		newItem.addActionListener(new ActionListener() 
		{              public  void actionPerformed(ActionEvent event) 
		{ originalImage=null; 
		repaint(); 

		} 
		}); 
		openItem = fileMenu.add("Open"); 
		openItem.addActionListener(new 
				ActionListener() 
		{              public void actionPerformed(ActionEvent event) 
		{              openFile(); 
		} 
		}); 
		closeItem = fileMenu.add("Close"); 
		fileMenu.addSeparator(); 
		saveItem=fileMenu.add("Save"); 
		saveItem.addActionListener(new 
				ActionListener() 
		{              public void actionPerformed(ActionEvent event) 
		{              

			try 
			{ 
				save=JOptionPane.showInputDialog("ENTER THE PATH WHERE THE FILE NEEDS TO BE SAVED"); 
				saveImage(filteredImage,save); 

			} 
			catch(Exception e) 
			{              System.out.println("ERROR IN SAVING THE FILE"); 
			}    
		} 
		}); 
		saveAsItem=fileMenu.add("Save as..."); 
		fileMenu.addSeparator(); 
		exitItem=fileMenu.add("Exit"); 

		//Setting the shortcut keys for menu items 
		newItem.setAccelerator(KeyStroke.getKeyStroke('N', InputEvent.CTRL_DOWN_MASK )); 
		openItem.setAccelerator(KeyStroke.getKeyStroke('O', InputEvent.CTRL_DOWN_MASK )); 
		saveItem.setAccelerator(KeyStroke.getKeyStroke('S', InputEvent.CTRL_DOWN_MASK )); 

		//EDIT MENU ACTIONS 
		undoItem=editMenu.add("Undo"); 
		undoItem.addActionListener(new 
				ActionListener() 
		{              public void actionPerformed(ActionEvent event) 
		{ filteredImage=o.undo(); 
		image=filteredImage; 
		repaint(); 
		} 
		}); 
		undoItem.setEnabled(false); 
		redoItem=editMenu.add("Redo"); 
		redoItem.addActionListener(new 
				ActionListener() 
		{              public void actionPerformed(ActionEvent event) 
		{ filteredImage=o.redo(); 
		image=filteredImage; 
		repaint(); 
		} 
		}); 
		undoItem.setEnabled(false); 
		editMenu.addSeparator(); 
		cutItem=editMenu.add("Cut"); 
		copyItem=editMenu.add("Copy"); 
		pasteItem=editMenu.add("Paste"); 

		// VIEW MENU ACTIONS 
		viewMenu.add(toolbarItem=new JCheckBoxMenuItem("Lock Toolbar",true)); 
		clrchooserItem=viewMenu.add("Choose colour"); 
		clrchooserItem.addActionListener(new 
				ActionListener() 
		{              public void actionPerformed(ActionEvent event) 
		{ c=JColorChooser.showDialog(frame.this,"Select a new color",Color.white); 
		} 
		}); 

		// FILTER MENU ACTIONS 
		blurItem=filterMenu.add("Blur Image"); 
		blurItem.addActionListener(new ActionListener() 
		{              public void actionPerformed(ActionEvent event) 
		{              
			float weight=1.0f/9.0f; 
			float[] elements =new float[9]; 
			for(int i=0;i<9;i++) 
			{              elements[i]=weight; 
			} 
			System.out.println("blur"); 
			if(image==null)return; 


			undoButton.setEnabled(true); 
			undoItem.setEnabled(true); 
			filteredImage=o.convolve(elements,image); 
			image=filteredImage; 

			repaint(); 
		}}); 

		sharpItem=filterMenu.add("Sharpen Image"); 
		sharpItem.addActionListener(new ActionListener() 
		{              public void actionPerformed(ActionEvent event) 
		{              
			float[] elements= 
				{              0.0f,-1.0f,0.0f, 
					-1.0f,5.f,-1.0f, 
					0.0f,-1.0f,0.0f 
				}; 

			System.out.println("sharp"); 
			if(image==null)return; 


			undoButton.setEnabled(true); 
			undoItem.setEnabled(true); 
			filteredImage=o.convolve(elements,image); 
			image=filteredImage; 

			repaint(); 
		}});              

		negativeItem=filterMenu.add("Image Negative");              
		negativeItem.addActionListener(new 
				ActionListener() 
		{              public void actionPerformed(ActionEvent event) 
		{              byte negative[]=new byte[256]; 
		for(int i=0;i<256;i++) 
		{              negative[i]=(byte)(255-i); 
		} 
		ByteLookupTable table=new ByteLookupTable(0,negative); 
		LookupOp op=new LookupOp(table,null); 
		filteredImage=o.filter(op,image); 
		image=filteredImage; 
		repaint(); 
		undoButton.setEnabled(true); 
		undoItem.setEnabled(true); 
		} 
		}); 

		grayscaleItem=colorMenu.add("GrayScale Conversion"); 
		grayscaleItem.addActionListener(new 
				ActionListener() 
		{              public void actionPerformed(ActionEvent event) 
		{ filteredImage=o.colorfilter(image); 
		image=filteredImage; 
		repaint(); 
		undoButton.setEnabled(true); 
		undoItem.setEnabled(true); 
		} 
		}); 

		brightItem=adjustMenu.add("BRIGHTNESS"); 
		brightItem.addActionListener(new 
				ActionListener() 
		{              public void actionPerformed(ActionEvent event) 
		{              byte[] data = new byte[256]; 
		for(int i = 0; i < 256; i++) 
			data[i] = (byte)(Math.sqrt((float)i/255.0) * 255); 
		ByteLookupTable table = new ByteLookupTable(0, data); 
		LookupOp op = new LookupOp(table, null); 
		filteredImage=o.filter(op,image); 
		image=filteredImage; 
		repaint(); 
		undoButton.setEnabled(true); 
		undoItem.setEnabled(true);                                                        

		} 
		}); 
		contrastItem=adjustMenu.add("CONTRAST"); 
		contrastItem.addActionListener(new 
				ActionListener() 
		{              public void actionPerformed(ActionEvent event) 
		{              float[] elements= 
	{              0.0f,-1.0f,0.0f, 
				-1.0f,6.f,-1.0f, 
				0.0f,-1.0f,0.0f 
	};              
		filteredImage=o.convolve(elements,image); 
		image=filteredImage; 
		repaint(); 
		undoButton.setEnabled(true); 
		undoItem.setEnabled(true); 
		} 
		}); 
		edgeDetect=adjustMenu.add("EDGE DETECTION"); 
		edgeDetect.addActionListener(new 
				ActionListener() 
		{              public void actionPerformed(ActionEvent event) 
		{              float[] elements= 
	{              -1.0f,0.0f,1.0f, 
				-2.0f,0.0f,2.0f, 
				-1.0f,0.0f,1.0f 
	};              
		filteredImage=o.convolve(elements,image); 
		image=filteredImage; 
		repaint(); 
		undoButton.setEnabled(true); 
		undoItem.setEnabled(true); 


		} 
		}); 

		toolbarItem.addActionListener(new ActionListener(){ public void actionPerformed(ActionEvent ae) 
		{   if(toolbarItem.getState()) 
			toolbar.setFloatable(false); 
		else 
			toolbar.setFloatable(true); 
		repaint(); 
		} 
		}); 
		bar.add(fileMenu); 
		bar.add(editMenu); 
		bar.add(viewMenu); 
		bar.add(filterMenu); 
		bar.add(colorMenu); 
		bar.add(adjustMenu); 
	} 



	public void actionPerformed(ActionEvent e) 
	{ 
	} 

	// OPEN FILE 
	public void openFile() 
	{              JFileChooser chooser=new JFileChooser(); 
	chooser.setCurrentDirectory(new File(".")); 
	chooser.setFileFilter(new 
			javax.swing.filechooser.FileFilter() 
	{              public boolean accept(File f) 
	{              String name=f.getName().toLowerCase();                                                                      
	return name.endsWith(".gif")||name.endsWith(".jpg")||name.endsWith(".jpeg")||f.isDirectory(); 
	} 
	public String getDescription() { return "Image Files";} 
	}); 

	int r=chooser.showOpenDialog(this); 
	if(r!=JFileChooser.APPROVE_OPTION) return; 

	try 
	{              image=ImageIO.read(chooser.getSelectedFile()); 
	originalImage=ImageIO.read(chooser.getSelectedFile()); 
	filteredImage=null; 

	} 
	catch(IOException e) 
	{              JOptionPane.showMessageDialog(this,e); 
	} 

	repaint(); 
	} 

	public void saveImage(BufferedImage img, String ref) 
	{  
		try 
		{  
			String format = (ref.endsWith(".png")) ? "png" : "jpg";  
			ImageIO.write(img, format, new File(ref));  
		} 
		catch (IOException e) 
		{  
			e.printStackTrace();  
		}  
	} 






	public void mousePressed(MouseEvent me) 
	{ 

	} 
	public void mouseReleased(MouseEvent me) 
	{ 

	} 



	public void mouseDragged(MouseEvent me) 
	{ 

	} 
	public void mouseClicked(MouseEvent e){} 
	public void mouseEntered(MouseEvent e){} 
	public void mouseExited(MouseEvent e){} 
	public void mouseMoved(MouseEvent e){} 
	public BufferedImage originalImage,image,bufferedImage, filteredImage; 
	private JMenuBar bar; 
	private JMenuItem newItem, openItem, closeItem, saveItem, saveAsItem, exitItem, cutItem,copyItem, pasteItem, undoItem, redoItem, clrchooserItem, blurItem,sharpItem, negativeItem, grayscaleItem, brightItem, 
	contrastItem,edgeDetect; 
	private JCheckBoxMenuItem toolbarItem; 

	private JToolBar toolbar; 
	private static final int DEFAULT_WIDTH=1024; 
	private static final int DEFAULT_HEIGHT=768; 
} 


class opr{ 
	int n=0; 
	public BufferedImage filteredImage; 
	public BufferedImage[] imageBackup=new BufferedImage[5]; 

	BufferedImage filter( BufferedImageOp op, BufferedImage image) 
	{              
		if (image==null) return null; 
		n++; 
		filteredImage=new BufferedImage(image.getWidth(),image.getHeight(),image.getType()); 
		op.filter(image,filteredImage); 

		if(n<5) 
			imageBackup[n]=filteredImage; 
		else 
		{for(int i=0;i<5;i++) 
			imageBackup[i]=imageBackup[i+1]; 
		imageBackup[5]=filteredImage; 
		} 
		return filteredImage; 
	} 

	BufferedImage convolve(float[] elements, BufferedImage image ) 
	{              Kernel kernel=new Kernel(3,3,elements); 
	ConvolveOp op=new ConvolveOp(kernel); 
	filter(op,image); 

	System.out.println("convolve"); 
	return filteredImage; 
	} 

	BufferedImage colorfilter(BufferedImage image) 
	{  n++; 
	filteredImage=image; 
	ColorConvertOp colorConvert = new ColorConvertOp(ColorSpace.getInstance(ColorSpace.CS_GRAY), null); 
	//BufferedImage grayImage; 
	colorConvert.filter(filteredImage,filteredImage ); 

	if(n<5) 
		imageBackup[n]=filteredImage; 
	else 
	{for(int i=0;i<5;i++) 
		imageBackup[i]=imageBackup[i+1]; 
	imageBackup[5]=filteredImage; 
	} 
	return filteredImage; 
	} 
	BufferedImage undo() 
	{ n=n-1; 
	if(n<0) 
		// undoItem.setEnabled(false); 
		//redoItem.setEnabled(true);              
		try 
	{filteredImage=imageBackup[n]; 
	} 
	catch(Exception e) 
	{ 
	} 

	return imageBackup[n]; 
	} 

	BufferedImage  redo() 
	{ n=n+1; 
	try 
	{filteredImage=imageBackup[n]; 
	} 
	catch(Exception e) 
	{ 
	} 
	return filteredImage ; 
	} 


}              


