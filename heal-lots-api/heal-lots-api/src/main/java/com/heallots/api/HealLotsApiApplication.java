package com.heallots.api;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.ComponentScan;

@SpringBootApplication
@ComponentScan(basePackages = {
	"com.heallots.api.config",
	"com.heallots.api.features.authentication",
	"com.heallots.api.features.appointments",
	"com.heallots.api.features.reviews"
})
public class HealLotsApiApplication {

	public static void main(String[] args) {
		SpringApplication.run(HealLotsApiApplication.class, args);
	}

}
