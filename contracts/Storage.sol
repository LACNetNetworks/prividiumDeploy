pragma solidity >=0.8.24;
/**
 * @title Storage
 * @dev Store & retreive value in a variable
 */
contract Storage {

    uint256 number;
    address owner;

    constructor()  {
        owner = msg.sender;  
    }

    /**
     * @dev Store value in variable
     * @param num value to store
     */
    function store(uint256 num) public {
        number = num;
        emit ValueSeted(msg.sender,num); 
    }

    /**
     * @dev Return value
     * @return value of 'number'
     */
    function retreive() public view returns (uint256){
        return number;
    }

    function getOwner() public view returns (address){
        return owner;
    }

    event ValueSeted(address sender, uint256 value);
}
