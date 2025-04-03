create table accounts(
    account_id int primary key auto_increment,
    account_name varchar(50) not null,
    username varchar(50) not null,
    password varchar(50) not null,
    created_at timestamp default current_timestamp,
    updated_at timestamp default current_timestamp on update current_timestamp
);


create table customer(
    customer_id int primary key auto_increment,
    first_name varchar(50) not null,
    middle_name varchar(50) not null,
    last_name varchar(50) not null,
    address varchar(255) not null,
    birthdate varchar(20) not null,
    status varchar(10) default "Active",
    created_at timestamp default current_timestamp,
    updated_at timestamp default current_timestamp on update current_timestamp
);



insert into accounts(account_name, username, password) values ('admin', 'admin', 'admin123');