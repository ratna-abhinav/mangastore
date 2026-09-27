package com.example.shoppingdotcom;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;

@SpringBootApplication
@ConfigurationPropertiesScan
public class ShoppingdotcomApplication {

	public static void main(String[] args) {
		SpringApplication.run(ShoppingdotcomApplication.class, args);
	}

}
