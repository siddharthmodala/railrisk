package com.r3;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.io.PrintWriter;
import java.io.StringReader;
import java.util.Properties;








import javax.json.*;
import javax.json.stream.JsonParser;
import javax.mail.Message;
import javax.mail.MessagingException;
import javax.mail.PasswordAuthentication;
import javax.mail.Session;
import javax.mail.Transport;
import javax.mail.internet.InternetAddress;
import javax.mail.internet.MimeMessage;
import javax.servlet.ServletException;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

/**
 * Servlet implementation class EmailClient
 */
public class EmailClient extends HttpServlet {
	private static final long serialVersionUID = 1L;
       
    /**
     * @see HttpServlet#HttpServlet()
     */
    public EmailClient() {
        super();
        // TODO Auto-generated constructor stub
    }
    // Sender's email ID needs to be mentioned
    static final String FROM = "railroadrisk@gmail.com";
    static final String PASS = "railrisk123";
    static final String SMTP_USERNAME = "AKIAISIUIUMPSAC2FXIQ";  // Replace with your SMTP username.
    static final String SMTP_PASSWORD = "AuaMTJL9DVe7WUGWFWwIVbuThT1QOzTXHsAldX5gUM1t";  // Replace with your SMTP password.
    
    static final String HOST = "email-smtp.us-west-2.amazonaws.com";
    static final String TO = "tosiddharthsagar@gmail.com";
    static final String PORT = "25";
	/**
	 * @see HttpServlet#doGet(HttpServletRequest request, HttpServletResponse response)
	 */
	protected void doPost(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
		// TODO Auto-generated method stub
		 // Recipient's email ID needs to be mentioned.
		
	      // Get system properties
	      Properties properties = System.getProperties();
	      
	      properties.setProperty("mail.transport.protocol", "smtp");
	      properties.setProperty("mail.smtp.port", PORT );
	      properties.setProperty("mail.smtp.auth", "true");
	      properties.setProperty("mail.smtp.starttls.enable", "true");
	      properties.setProperty("mail.smtp.starttls.required", "true");
	      
	      Session session = Session.getDefaultInstance(properties);//,

	      //session.setDebug(true);
	      String res ="Feedback not sent";
	      // Set response content type
  	      response.setContentType("text/html");
  	      PrintWriter out = response.getWriter();
	  		try {  
	  	      StringBuffer sb = new StringBuffer();
	  	      BufferedReader br = new BufferedReader(new InputStreamReader(request.getInputStream()));
	  	      
	  	      String tempString ;
	  	      while((tempString = br.readLine())!= null)
	  	      {
	  	    	  sb.append(tempString);
	  	      }
	  	      
	  	      JsonReader jr = Json.createReader(new StringReader(sb.toString()));
	  	      
	  	      JsonObject jo = jr.readObject();
	  	      
	  	      String username = jo.getString("username");
	  	      String orgname = jo.getString("orgname");
	  	      String msg = jo.getString("message");
	  	      String useremail = jo.getString("senderemail");
	  	      String phone = jo.getString("phone");
	  	      // Create a default MimeMessage object.
		         MimeMessage message = new MimeMessage(session);
		         // Set From: header field of the header.
		         message.setFrom(new InternetAddress(FROM));
		         // Set To: header field of the header.
		         message.addRecipient(Message.RecipientType.TO,
		                                  new InternetAddress(TO));
		         // Set Subject: header field
		         message.setSubject("Feedback on Hazmat Tool(Railways)!");

		         // Send the actual HTML message, as big as you like
		         String actualMsg = "<h1> Feedback from " + username + " from organization " + orgname +"</h1></br><h3> Message: " + 
		        		 			msg + "</h3> </br></br></br> Contact Info: </br> Email Id: "+ useremail + "</br> Phone Number: " + phone;
		         message.setContent(actualMsg,"text/html" );
		          //Send message
		         System.out.println("Attempting to send an email through the Amazon SES SMTP interface...");
		         Transport transport = session.getTransport();
		         transport.connect(HOST, SMTP_USERNAME, SMTP_PASSWORD);
		         message.saveChanges();
		         transport.sendMessage(message, message.getAllRecipients());
		         transport.close();  
		         System.out.println("Email sent!");
		       //Transport.send(message);
		       res = "Feedback sent successfully. Thank you.";
			} catch (MessagingException e) {
				res = "Error while sending feedback";
				System.out.println("The email was not sent.");
	            System.out.println("Error message: " + e.getMessage());
			}
	  		out.println(res);
	   }
	}


