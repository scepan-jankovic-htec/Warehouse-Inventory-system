package com.warehouse.inventory;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * Main entry point for the Warehouse Inventory System Spring Boot application.
 * 
 * This application provides a REST API for managing warehouse and retail inventory
 * across multiple physical locations. It handles product catalogs, stock tracking,
 * inventory movements (receive, transfer, adjustment), and operational dashboards.
 */
@SpringBootApplication
public class InventoryApplication {

    public static void main(String[] args) {
        SpringApplication.run(InventoryApplication.class, args);
    }
}
