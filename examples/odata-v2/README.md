# odata2ts Example: OData V2

OData2ts generation example based on the publicly available [OData V2 service](https://www.odata.org/odata-services/)
(switch to tab "OData v2").

This repo serves as example of how to integrate `odata2ts`, but its also used internally as basis
for V2 integration tests.

## The Domain
Straight-forward and simple:

* Product
  * key: "ID" 
  * associations
    * one Category
    * one Supplier
* Category
  * key: "ID"
  * associations
    * multiple Products
* Supplier
  * key: "ID"
  * complex types
    * Address
  * associations
    * multiple Products

### Entry Points
* Products
* Categories
* Suppliers


