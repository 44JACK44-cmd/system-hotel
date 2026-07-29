package com.hotel.apifds20261.helper;

import java.security.SecureRandom;

public class GenericHelper {
	private GenericHelper() {}
	
	public static String followCodeGeneration() {
	    String characters = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
	    
	    SecureRandom random = new SecureRandom();
	    StringBuilder sb = new StringBuilder();

	    for (int i = 0; i < 7; i++) {
	        int index = random.nextInt(characters.length());
	        sb.append(characters.charAt(index));
	    }

	    return sb.toString();
	}
}
