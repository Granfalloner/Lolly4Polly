// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";

contract SocialFinance is Ownable {
    struct Borrower {
        bool isKYCCompleted;
    }

    struct Lender {
        bool isRegistered;
    }

    struct LoanApplication {
        uint256 amount;
        uint256 interestRate;
        address borrower;
        uint256 fundedAmount;
        bool isFunded;
        bool isClosed;
        mapping(address => uint256) contributions;
        address[] lenders; // Array to keep track of lenders' addresses
    }

    mapping(address => Borrower) public borrowers;
    mapping(address => Lender) public lenders;
    LoanApplication[] private loanApplications;

    uint256 public constant PLATFORM_COMMISSION_PERCENTAGE = 1;

    event BorrowerRegistered(address borrower);
    event KYCStatusUpdated(address borrower, bool isKYCCompleted);
    event LenderRegistered(address lender);
    event LoanApplicationCreated(uint256 applicationId, uint256 amount, uint256 interestRate);
    event LoanApplicationFunded(uint256 applicationId, address lender, uint256 amount);
    event LoanApplicationClosed(uint256 applicationId);
    event RepaymentDistributed(uint256 applicationId, address lender, uint256 amount);

    // Constructor
    constructor(address initialOwner) Ownable(initialOwner) {
    }

    // Register borrower
    function registerBorrower() public {
        require(!borrowers[msg.sender].isKYCCompleted, "Borrower already registered");
        borrowers[msg.sender] = Borrower(false);
        emit BorrowerRegistered(msg.sender);
    }

    // Update KYC status (only owner)
    function updateKYCStatus(address _borrower, bool _isKYCCompleted) public onlyOwner {
        require(_borrower != address(0), "Invalid borrower address");
        borrowers[_borrower].isKYCCompleted = _isKYCCompleted;
        emit KYCStatusUpdated(_borrower, _isKYCCompleted);
    }

    // Register lender
    function registerLender() public {
    require(!lenders[msg.sender].isRegistered, "Lender already registered");
        lenders[msg.sender] = Lender(true);
        emit LenderRegistered(msg.sender);
    }

    // Create a loan application
    function createLoanApplication(uint256 _amount, uint256 _interestRate) public {
    require(borrowers[msg.sender].isKYCCompleted, "Borrower is not KYC verified");

    LoanApplication storage newApplication = loanApplications.push();
    newApplication.amount = _amount;
    newApplication.interestRate = _interestRate;
    newApplication.borrower = msg.sender;
    newApplication.fundedAmount = 0;
    newApplication.isFunded = false;
    newApplication.isClosed = false;

    emit LoanApplicationCreated(loanApplications.length - 1, _amount, _interestRate);
 }

    // Fund a loan application
    function fundLoanApplication(uint256 _applicationId) public payable {
        require(_applicationId < loanApplications.length, "Invalid application ID");
        require(msg.value > 0, "Amount must be greater than 0");

        LoanApplication storage application = loanApplications[_applicationId];
        require(!application.isClosed, "Application is closed");
        // require(application.fundedAmount.add(msg.value) <= application.amount, "Funding exceeds loan amount");

        application.contributions[msg.sender] += msg.value;
        application.fundedAmount += msg.value;

        if (application.fundedAmount == application.amount) {
            application.isFunded = true;
        }

        if (application.contributions[msg.sender] == 0) {
            application.lenders.push(msg.sender);
        }

        payable(application.borrower).transfer(msg.value);

        emit LoanApplicationFunded(_applicationId, msg.sender, msg.value);
    }

    function closeLoanApplication(uint256 _applicationId) public payable {
        require(_applicationId < loanApplications.length, "Invalid application ID");

        LoanApplication storage application = loanApplications[_applicationId];
        require(msg.sender == application.borrower, "Only the borrower can close the application");
        require(application.isFunded, "Loan application is not fully funded");
        require(!application.isClosed, "Loan application is already closed");

        uint256 repaymentAmount = application.fundedAmount + (application.fundedAmount * application.interestRate) / 100;
        uint256 platformCommission = (repaymentAmount * PLATFORM_COMMISSION_PERCENTAGE) / 100;
        uint256 totalRepayable = repaymentAmount + platformCommission;

        require(msg.value == totalRepayable, "Incorrect repayment amount");

        application.isClosed = true;

        // Distribute repayments to lenders of this specific application
        for (uint256 i = 0; i < application.lenders.length; i++) {
            address lenderAddress = application.lenders[i];
            uint256 lenderContribution = application.contributions[lenderAddress];
            if (lenderContribution > 0) {
                uint256 lenderRepayment = lenderContribution + (lenderContribution * application.interestRate) / 100;
                payable(lenderAddress).transfer(lenderRepayment);
                emit RepaymentDistributed(_applicationId, lenderAddress, lenderRepayment);
            }
        }

        // Transfer platform commission to the contract owner
        payable(owner()).transfer(platformCommission);

        emit LoanApplicationClosed(_applicationId);
    }


    // Getter function for loan application details (optional)
    function getLoanApplicationDetails(uint256 _applicationId) public view returns (uint256, uint256, address, uint256, bool, bool) {
        require(_applicationId < loanApplications.length, "Invalid application ID");
        LoanApplication storage application = loanApplications[_applicationId];
        return (
            application.amount,
            application.interestRate,
            application.borrower,
            application.fundedAmount,
            application.isFunded,
            application.isClosed
        );
    }
}
