const INITIAL_DATA = `
INSERT INTO \`katerinidb\`.\`users\` (\`username\`, \`password\`, \`email\`)
VALUES
('nikos', '$2a$12$lvGByG0guT1DvKYBLKvoYeGrHLK2BuENRdOWVjukwsQBIQf06xZ4e', 'nikos@test.com'),
('lampros', '$2a$12$lvGByG0guT1DvKYBLKvoYeGrHLK2BuENRdOWVjukwsQBIQf06xZ4e', 'lampros@test.com');
`;

module.exports = { INITIAL_DATA };
