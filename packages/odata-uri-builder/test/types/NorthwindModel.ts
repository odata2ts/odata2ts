export interface Category {
    CategoryID: number;
    CategoryName: string;
    Description?: string;
    Picture?: string;
    Products: Array<Product>;
}

export interface CustomerDemographic {
    CustomerTypeID: string;
    CustomerDesc?: string;
    Customers: Array<Customer>;
}

export interface Customer {
    CustomerID: string;
    CompanyName: string;
    ContactName?: string;
    ContactTitle?: string;
    Address?: string;
    City?: string;
    Region?: string;
    PostalCode?: string;
    Country?: string;
    Phone?: string;
    Fax?: string;
    Orders: Array<Order>;
    CustomerDemographics: Array<CustomerDemographic>;
}

export interface Employee {
    EmployeeID: number;
    LastName: string;
    FirstName: string;
    Title?: string;
    TitleOfCourtesy?: string;
    BirthDate?: string;
    HireDate?: string;
    Address?: string;
    City?: string;
    Region?: string;
    PostalCode?: string;
    Country?: string;
    HomePhone?: string;
    Extension?: string;
    Photo?: string;
    Notes?: string;
    ReportsTo?: number;
    PhotoPath?: string;
    Employees1: Array<Employee>;
    Employee1: Employee;
    Orders: Array<Order>;
    Territories: Array<Territory>;
}

export interface Order_Detail {
    OrderID: number;
    ProductID: number;
    UnitPrice: string;
    Quantity: string;
    Discount: string;
    Order: Order;
    Product: Product;
}

export interface Order {
    OrderID: number;
    CustomerID?: string;
    EmployeeID?: number;
    OrderDate?: string;
    RequiredDate?: string;
    ShippedDate?: string;
    ShipVia?: number;
    Freight?: string;
    ShipName?: string;
    ShipAddress?: string;
    ShipCity?: string;
    ShipRegion?: string;
    ShipPostalCode?: string;
    ShipCountry?: string;
    Customer: Customer;
    Employee: Employee;
    Order_Details: Array<Order_Detail>;
    Shipper: Shipper;
}

export interface Product {
    ProductID: number;
    ProductName: string;
    SupplierID?: number;
    CategoryID?: number;
    QuantityPerUnit?: string;
    UnitPrice?: string;
    UnitsInStock?: string;
    UnitsOnOrder?: string;
    ReorderLevel?: string;
    Discontinued: boolean;
    Category: Category;
    Order_Details: Array<Order_Detail>;
    Supplier: Supplier;
}

export interface Region {
    RegionID: number;
    RegionDescription: string;
    Territories: Array<Territory>;
}

export interface Shipper {
    ShipperID: number;
    CompanyName: string;
    Phone?: string;
    Orders: Array<Order>;
}

export interface Supplier {
    SupplierID: number;
    CompanyName: string;
    ContactName?: string;
    ContactTitle?: string;
    Address?: string;
    City?: string;
    Region?: string;
    PostalCode?: string;
    Country?: string;
    Phone?: string;
    Fax?: string;
    HomePage?: string;
    Products: Array<Product>;
}

export interface Territory {
    TerritoryID: string;
    TerritoryDescription: string;
    RegionID: number;
    Region: Region;
    Employees: Array<Employee>;
}

export interface Alphabetical_list_of_product {
    ProductID: number;
    ProductName: string;
    SupplierID?: number;
    CategoryID?: number;
    QuantityPerUnit?: string;
    UnitPrice?: string;
    UnitsInStock?: string;
    UnitsOnOrder?: string;
    ReorderLevel?: string;
    Discontinued: boolean;
    CategoryName: string;
}

export interface Category_Sales_for_1997 {
    CategoryName: string;
    CategorySales?: string;
}

export interface Current_Product_List {
    ProductID: number;
    ProductName: string;
}

export interface Customer_and_Suppliers_by_City {
    City?: string;
    CompanyName: string;
    ContactName?: string;
    Relationship: string;
}

export interface Invoice {
    ShipName?: string;
    ShipAddress?: string;
    ShipCity?: string;
    ShipRegion?: string;
    ShipPostalCode?: string;
    ShipCountry?: string;
    CustomerID?: string;
    CustomerName: string;
    Address?: string;
    City?: string;
    Region?: string;
    PostalCode?: string;
    Country?: string;
    Salesperson: string;
    OrderID: number;
    OrderDate?: string;
    RequiredDate?: string;
    ShippedDate?: string;
    ShipperName: string;
    ProductID: number;
    ProductName: string;
    UnitPrice: string;
    Quantity: string;
    Discount: string;
    ExtendedPrice?: string;
    Freight?: string;
}

export interface Order_Details_Extended {
    OrderID: number;
    ProductID: number;
    ProductName: string;
    UnitPrice: string;
    Quantity: string;
    Discount: string;
    ExtendedPrice?: string;
}

export interface Order_Subtotal {
    OrderID: number;
    Subtotal?: string;
}

export interface Orders_Qry {
    OrderID: number;
    CustomerID?: string;
    EmployeeID?: number;
    OrderDate?: string;
    RequiredDate?: string;
    ShippedDate?: string;
    ShipVia?: number;
    Freight?: string;
    ShipName?: string;
    ShipAddress?: string;
    ShipCity?: string;
    ShipRegion?: string;
    ShipPostalCode?: string;
    ShipCountry?: string;
    CompanyName: string;
    Address?: string;
    City?: string;
    Region?: string;
    PostalCode?: string;
    Country?: string;
}

export interface Product_Sales_for_1997 {
    CategoryName: string;
    ProductName: string;
    ProductSales?: string;
}

export interface Products_Above_Average_Price {
    ProductName: string;
    UnitPrice?: string;
}

export interface Products_by_Category {
    CategoryName: string;
    ProductName: string;
    QuantityPerUnit?: string;
    UnitsInStock?: string;
    Discontinued: boolean;
}

export interface Sales_by_Category {
    CategoryID: number;
    CategoryName: string;
    ProductName: string;
    ProductSales?: string;
}

export interface Sales_Totals_by_Amount {
    SaleAmount?: string;
    OrderID: number;
    CompanyName: string;
    ShippedDate?: string;
}

export interface Summary_of_Sales_by_Quarter {
    ShippedDate?: string;
    OrderID: number;
    Subtotal?: string;
}

export interface Summary_of_Sales_by_Year {
    ShippedDate?: string;
    OrderID: number;
    Subtotal?: string;
}
