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

create table loan(
    loan_id int primary key auto_increment,
    customer_id int not null,
    loan_start date not null,
    months int not null,
    loan_end date not null,
    transaction_date date not null,
    loan_amount float not null,
    interest float not null,
    gross_receivable float not null,
    payday_payment float not null,
    service float not null,
    balance float not null,
    adjustment float not null,
    overall_balance float not null,
    status varchar(10) default "Active",
    created_at timestamp default current_timestamp,
    updated_at timestamp default current_timestamp on update current_timestamp,
    constraint fk_customer foreign key (customer_id) references customer(customer_id) on delete cascade
);

INSERT INTO loan (
    customer_id, loan_start, months, loan_end, transaction_date, 
    loan_amount, interest, gross_receivable, payday_payment, service, balance, adjustment, overall_balance
) 
VALUES (
    1, '2025-04-03', 5, '2025-09-03', '2025-04-03', 
    20000, 0.05, 21000, 0.00, 0.00, 21000, 0.00, 21000
);



create table receipt(
    pay_id int primary key auto_increment,
    loan_id int not null,
    to_pay float not null,
    schedule varchar(20) not null,
    amount float not null,
    transaction_time timestamp default current_timestamp,
    status varchar(10) not null default 'Not Paid',
    updated_at timestamp default current_timestamp on update current_timestamp,
    constraint fk_loan foreign key(loan_id) references loan(loan_id) on delete cascade
);

CREATE TABLE paymentHistory (
    history_id INT PRIMARY KEY AUTO_INCREMENT,
    loan_id INT NOT NULL,
    pay_id INT NOT NULL,
    amount FLOAT NOT NULL,
    payment_method VARCHAR(10) NOT NULL,
    notes VARCHAR(100) NOT NULL,
    transaction_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_payment_loan FOREIGN KEY (loan_id) REFERENCES loan(loan_id) ON DELETE CASCADE,
    CONSTRAINT fk_payment_receipt FOREIGN KEY (pay_id) REFERENCES receipt(pay_id) ON DELETE CASCADE
);

