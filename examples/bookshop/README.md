# odata2ts Example: Bookshop (CAP V2 & V4)

[`odata2ts`](https://github.com/odata2ts/odata2ts) generation example which facilitates 
[CAP](https://cap.cloud.sap/docs/about/) (**C**loud **A**pplication **P**rogramming Model) as OData server. 
The example itself is based on the [Bookshop Demo](https://github.com/SAP-samples/cloud-cap-samples/tree/main/bookshop).

This repo serves as example of how to integrate `odata2ts` with CAP. One specialty in contrast to other 
technologies. With the help of the `cds` command, EDMX (the metadata description of the service) can be 
generated via the command line; so no need to spin up the server and download the metadata file.
Other features:
* supports V4 out-of-the-box
* supports V2 via adapter
* managed fields, e.g. `modifiedBy` or `modifiedAt`

This example is also used internally as part of the build process by providing integration tests.

## Provided Services
The bookshop demo consists of two OData services revolving around the same entities: `Books`, `Authors`, `Genres`.
* CatalogService: Lists books
  * [https://localhost:4004/browse](https://localhost:4004/browse)
  * no login neeced (user name = anonymous)
  * no edit actions exposed
  * authors are not accessible here; only author name is exposed on books
* AdminService: Full CRUD capabilities
  * [https://localhost:4004/admin](https://localhost:4004/admin)
  * user: name = alice and empty pwd

Each service also provides for a v2 version:
* CatalogService V2: [https://localhost:4004/v2/browse](https://localhost:4004/v2/browse)
* AdminService V2: [https://localhost:4004/v2/admin](https://localhost:4004/v2/admin)

## The Domain

CAP automatically manages some typical fields like: `ID`, `createdAt`, `createdBy`, `modifiedBy`, `modifiedAt`.
These fields are not editable by the client (they can be submitted and are ignored actually),
so the generated editable model versions don't contain them.

* Books
  * key: "ID" 
  * associations
    * one Author: in CatalogService only the author name is exposed
    * one Genre
* Authors: not exposed in CatalogService
  * key: "ID"
  * associations
    * multiple Books
* Genres
  * key: "ID"
  * associations
    * hierarchy of genres: one parent genre, multiple child genres
    * multiple texts
    * multiple localized texts

