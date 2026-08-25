---
layout: page
title: Reading specifications
copyright-holder: "Intel Corporation"
copyright-year: 2025-2026
---

Instruction specifications are written in Intel® ISA Specification Language.


## Limitations of the executable specifications

The executable specification should be read in combination with the
natural language parts of the specification.
In particular, memory accesses may be performed in a different order from
that shown in the executable specification. (See "Memory
Ordering" in Chapter 8 of the Intel® 64
and IA-32 Architectures Software Developer’s Manual, Volume 3, for
guidelines on memory ordering.)
Exception prioritization may differ from that shown in the
executable specification.
And some memory accesses may be performed even if an exception occurs.

## Basic Specification Language Concepts

The Intel® ISA Specification Language provides the following types

- The type `Integer` representing mathematical (unbounded) integers.
- Set types such as `{8, 16, 32, 64}` or `{0..15}` represent a subset of the integers.
- The type `Bits(N)` representing bitvectors of length `N`.
  The type `Bit` is short for `Bits(1)`.
- The type `Boolean` with values `True` and `False`.
- Tuple types such as `(Bits(32), Boolean)` representing a pair of a bitvector and a Boolean.

You can also define record types with named fields,
enumeration types with named constant values,
and arrays.

Arithmetic values include

- Decimal integers `1000`.
- Binary bitvectors such as `0b101`.
- Hexadecimal bitvectors such as `0xFFFF`.
  (The length of a hexadecimal bitvector is 4 times the number of digits.)

All three can optionally be written with underscores to make large numbers easier
to understand. For example, `1_000_000_000`, `0b1111_0000`, and `0xFFFF_0000`.

Comments start with the symbols `//` and continue until the end of the line.

The following arithmetic operators are used

- The usual equality operators ---  `==` and `!=` on all types.
- The usual ordering operators ---  `<`, `<=`, `>=` and `>` on the type Integer.
- The usual arithmetic operators ---  `+`, `-`, `*`.
- Integer exponentiation ---  `**`. This is almost always used in the form `2 ** x`.
- Boolean and Bitvector operations ---  `and`, `or`, `xor` and `not`.
- Boolean shortcircuiting operations ---  `and then` and `or else`.
  (These are 'shortcircuiting' operators: like `&&` and `||` in C/C++,
  the second operand is not evaluated unless needed.)

There are three pairs of integer division and remainder operations that have
the same behavior on positive numbers and different rounding behavior on
negative numbers.

- `Std::Integer::Floor_Divide` rounds down to -infinity and `Std::Integer::Floor_Remainder` provides the remaining part;
- `Std::Integer::Truncated_Divide` rounds up or down towards zero and `Std::Integer::Truncated_Remainder` provides the remaining part;
- For convenience, `x / y` and `x % y` may be used when neither `x` or `y` is negative.

Bitslice operations are used to extract part of a bitvector.  There are several
different notations that can be used to extract a single bit or multiple bits.

- `x[63]` - bit index (`e[index]`)
- `x[31 : 0]` - range-based bitslice (`e[high : low]`)
- `x[16 +: 8]` - width-based bitslice (`e[low +: width]`)
- `x[63 -: 8]` - width-based bitslice (`e[high -: width]`)
- `x[i *: 8]` - element bitslice `(e[index *: width])`

The notation `x[16 +: 8]` is equivalent to `x[23:16]` (both extract bits 23 down
to 16 of the variable `x`).
The notation `x[63 -: 8]` refers to the top 8 bits of `x` (assuming that `x` is 64-bits).
That is, `x[high -: width]` is equivalent to `x[high : high-width+1]`.
The notation `x[i *: 8]` refers to the i'th byte of `x` and is equivalent to `x[i*width +: width]` or `x[(i+1)*width-1 : i*width]` where `width` = 8.
The choice of bitslice notation does not affect the meaning
but is used to textually emphasize either
the topmost bit being extracted,
or the width of the value being extracted,
or that the bitvector is split into a number of equally sized elements.

Some processor registers have named bitfields.
For example, the RFLAGS register defines `CF` (as a name for slice `[0]`), `ZF` (slice `[6]`), and others.
This allows us to write `RFLAGS.CF`, `RFLAGS.ZF`, etc. instead of `RFLAGS[0]`, `RFLAGS.ZF`, etc.

The notation `x ++ y` is used to concatenate bitvectors `x` and `y` into a
single bitvector.  The top bits of the result are the bits from `x`; and the
bottom bits of the result are the bits from `y`.
For example, `top ++ middle ++ bottom` - concatenates three bitvectors into a single bitvector.

Complex bitslices extract individual slices and concatenate them. For example, `x[31:16,7:0]` is equivalent to `x[31:16] ++ x[7:0]`.


In addition,

- Record field access --- `r.address` (Note that the same syntax is used for bitslicing.)
- Array subscript  --- `x[i]` (Note that the same syntax is used for bitslicing.)
- Conditional expressions --- `if x < y then x else y`
- Membership tests ---
  `v in 0b11xx` (test whether the top two bits of `v` are both `0b1` and ignore the bottom two "don't care" 'x' bits);
  `size in {8,16,32,64}` (test whether `size` has one of the listed values); and
  `index not in {0..15}` (test whether `index` is outside the specified range).
- Tuple expressions --- `(1, True)` which creates a pair of an Integer and a Boolean.
- Record expressions --- `MyRecord{ address => Zeros(64), valid => False }` creates a record value with specified field values.
- Array expressions --- `array of { 0, 4, 2, 6, 1, 5, 3, 7 }` creates an array value with specified element values.
- Architecturally unspecified values --- `UNSPECIFIED : Bits(64)` which is used when the architecture allows several choices of behavior.

The following arithmetic functions are provided.
Namespace prefixes such as "Std::Bits" are omitted for the more commonly used functions such as `Zeros` but retained for more obscure functions such as `Std::Unreachable`.

<div class="isa_defn" name="Std::Bits::Zeros"></div>
<div class="isa_defn" name="Std::Bits::All_Ones"></div>
<div class="isa_defn" name="Std::Bits::Is_Zero"></div>
<div class="isa_defn" name="Std::Bits::Is_All_Ones"></div>
<div class="isa_defn" name="Std::Bits::Repeat"></div>
<div class="isa_defn" name="Std::Bits::Zero_Extend"></div>
<div class="isa_defn" name="Std::Bits::Sign_Extend"></div>
<div class="isa_defn" name="Std::Bits::Extend"></div>
<div class="isa_defn" name="Std::Bits::Length"></div>
<div class="isa_defn" name="Std::Bits::Unsigned"></div>
<div class="isa_defn" name="Std::Bits::Signed"></div>
<div class="isa_defn" name="Std::Bits::AlignDown"></div>
<div class="isa_defn" name="Std::Bits::AlignUp"></div>
<div class="isa_defn" name="Std::Bits::Shift_Left"></div>
<div class="isa_defn" name="Std::Bits::Shift_Right_Logical"></div>
<div class="isa_defn" name="Std::Bits::Shift_Right_Arithmetic"></div>
<div class="isa_defn" name="Std::Bits::Rotate_Left"></div>
<div class="isa_defn" name="Std::Bits::Rotate_Right"></div>
<div class="isa_defn" name="Std::Bits::Unsigned_Saturate"></div>
<div class="isa_defn" name="Std::Bits::Signed_Saturate"></div>
<div class="isa_defn" name="Std::Bits::Count_Set_Bits"></div>
<div class="isa_defn" name="Std::Bits::Count_Leading_Zero_Bits"></div>
<div class="isa_defn" name="Std::Bits::Count_Leading_Sign_Bits"></div>
<div class="isa_defn" name="Std::Bits::Is_Parity_Even"></div>
<div class="isa_defn" name="Std::Bits::Is_Parity_Odd"></div>
<div class="isa_defn" name="Std::Bits::From_Integer"></div>

<div class="isa_defn" name="Std::Integer::Abs"></div>
<div class="isa_defn" name="Std::Integer::Min"></div>
<div class="isa_defn" name="Std::Integer::Max"></div>
<div class="isa_defn" name="Std::Integer::AlignDown"></div>
<div class="isa_defn" name="Std::Integer::AlignUp"></div>
<div class="isa_defn" name="Std::Integer::Is_Power_Of_Two"></div>
<div class="isa_defn" name="Std::Integer::Log2"></div>
<div class="isa_defn" name="Std::Integer::Is_Even"></div>
<div class="isa_defn" name="Std::Integer::Is_Odd"></div>
<div class="isa_defn" name="Std::Integer::Shift_Left"></div>
<div class="isa_defn" name="Std::Integer::Shift_Right"></div>
<div class="isa_defn" name="Std::Integer::Truncated_Divide"></div>
<div class="isa_defn" name="Std::Integer::Truncated_Remainder"></div>
<div class="isa_defn" name="Std::Integer::Floor_Divide"></div>
<div class="isa_defn" name="Std::Integer::Floor_Remainder"></div>

<div class="isa_defn" name="Std::Unreachable"></div>

## Statements

### Variables and assignments

Variables can be "immutable" (their value cannot be changed) or "mutable"
(their value can be changed by assigning to them).

- `let x := <expression>;` --- define an immutable variable
- `var x := <expression>;` --- declare a mutable variable with initializer
- `var x : <type>;` --- declare a mutable variable with no initializer
- `x := <expression>;` --- assign to a variable
- `(x, y) := <expression>;` --- assign a tuple to a pair of variables
- `x[7 : 0] := Zeros(8);` --- assign to a slice of a bitvector `x`
- `y[i] := Zeros(8);` --- assign to an array `y` or to a slice of `y`
- `let (max, min) := if a >= b then (a, b) else (b, a);` --- initializing several variables


### Control flow

Control flow statements have their normal meaning

- `if <condition> then <statements> { elsif <condition> then <statements> } [else <statements>] endif;`
- `case <expression> of { when <pattern> [where <condition>] => <statements> } [otherwise => <statements>] endcase;`
- `for x := <expression> to <expression> do <statements> endfor;`
- `for x := <expression> downto <expression> do <statements> endfor;`
- `while <condition> do <statements> endwhile;`
- `repeat <statements> until <condition>;`
- `return <expression>;` --- return from a function with a return type
- `return;` --- return from a function with no return type


### Exceptions

Exceptions can be thrown and caught.

- `throw <expression>;`
- `try <statements> catch x {when <identifier> : <type> => <statements>} [otherwise => <statements>] endtry;`

Calls to a function `F` that can throw an exception are marked with either `?` or `!`.

- `F!(x)` indicates a call to a function that always throws an exception.
  Calls to this function cannot return.

- `F?(x)` indicates a call to a function that could throw an exception.
  Calls to this function may not return.

- `F(x)` indicates a call to a function that cannot throw an exception.
  Calls to this function will always return.

Function definitions are also marked with exception markers. For example

```isa
function AbortExecution!()
begin
    throw EndOfInstruction;
end
```

*[Exception markers are an experimental extension of the specification language that are intended
to make it easier to understand the impact of exceptions on the meaning of
the specification.
We welcome feedback on whether the markers are helpful or distracting and
on how they can be improved.
This will help determine whether they are permanently adopted into the language or whether
we abandon the experiment and remove all exception markers.]*


### Assertions

- `assert <expression>;`
- `Std::Unreachable();` --- this function should never be called

Note that failing an assertion or executing `Std::Unreachable` 
indicates that there is a bug in the specification.
Failing an assertion is not the same as throwing an exception and
functions that contain assertions need not have exception markers.



## Function definitions

Functions can be defined and called using either conventional syntax such as `F(x,y)`
or, to support the "Uniform Access Principle", they can be defined and called with
no arguments (e.g., `G`) or using an array/bitslice-like syntax `H[i]`.


### Functions that return a value

Functions that return a value can be used in expressions.

```isa
function Concat(x : Bits(32), y : Bits(32)) -> Bits(64)
begin
    return y ++ x;
end
```

or

```isa
function Current_Mode() -> Execution_Mode
begin
    if CR0.PE == 0b0 then
        return Real_Address_Mode;
    elsif IA32_EFER.LMA == 0b1 then
        return IA32e_Mode;
    elsif RFLAGS.VM == 0b1 then
        return Virtual_8086_Mode;
    else
        return Protected_Mode;
    endif;
end
```

### Functions that do not return a value

Functions that do not return a value can be called from statements.

```isa
function BranchTo(x : Bits(32))
begin
    RIP := x;
end
```

### Syntactic variations of function definitions

To balance the need for precision / completeness against readability,
functions support a number of syntactic variations.
This is typically used for processor registers where accessing the
register requires some calculation such as bitslicing or masking bits
or where a register file is best understood as an array.

Using this alternative syntax has no impact on the behavior of the functions but is used
to textually simplify the appearance of the specification and
to support the "Uniform Access Principle".

Where these syntactic variations are used, calls to functions must be
consistent with the definition of the function.

#### Nullary functions

Functions with no arguments can optionally omit the parentheses.
This is typically used for processor registers where accessing the
register requires some calculation such as bitslicing or masking bits.

```isa
function EAX -> Bits(32)
begin
    return RAX[31:0];
end
```

An example of calling this function is the expression `EAX + 4`.

#### Array functions

Functions with arguments can optionally use square brackets 

```isa
function XMM[r : Integer] -> Bits(128)
begin
    return ZMM[r][0 +: 128];
end
```

An example of calling this function is the expression `XMM[index]`.

#### Assignment functions

A function can be defined using assignment syntax and called using the
normal assignment statement syntax.

For example

```isa
function EAX := value : Bits(32)
begin
    RAX := Zero_Extend(value, 64);
end
```

An example of calling this function is the statement `EAX := Zeros(32);`

An example assignment function that uses the array syntax is
XMM that provide write access to the bottom 128 bits of the ZMM
register file.

```isa
function XMM[r : Integer] := value : Bits(128)
begin
    ZMM[r][0 +: 128] := value;
end
```

An example of calling this function is the statement `XMM[index] := Zeros(128);`.


#### Using the same name for assignment functions and for nullary/array functions

When an assignment function has the same name as a corresponding reader function
(i.e., a nullary or array function),
the choice of which function is called is based on whether a value is being read or written.

For example, this statement calls the nullary function `EAX` to read the bottom 32-bits of RAX

```isa
let value = EAX;
```

And this statement calls the assignment function `EAX:=` to change RAX

```isa
EAX := Zero(32);
```


When an assignment function is used in a way that requires
a read-modify-write (e.g., assignment to a bitslice)
an implicit call to the corresponding reader function is generated.
For example, this statement clears the bottom byte of RAX
by calling the nullary function `EAX` to read the current value,
assigning `0b0000_0000` to the bitslice `[7:0]`,
and calling the assignment function `EAX:=` to write the new value.

```isa
EAX[7:0] := 0b0000_0000;
```
