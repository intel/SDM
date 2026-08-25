# Specification style guide

To help create consistent, high quality, readable specifications, it is useful to define a style guide
for how specifications should be written.

## Overall goal

The primary goal of this style guide is to promote the creation of specifications that are easy
to understand even if you are unfamiliar with the specifications language.
In practice, this often results in a slightly more verbose style than we would use within
a small team of programmers who are all experts in the use of specifications and are primarily communicating
with the specifications toolchain and themselves.

Having a style guide will also promote uniformity that makes it easier for readers to
grasp the specification without being distracted by minor stylistic variations.
(We may add a plugin interface to the specification tools to allow some automated detection of exceptions to the guide.)

*[Note: when adding to this file, the section name should be a brief statement
of the rule so that the table of contents acts as a summary of the rules.]*

1. This entry will be replaced by the table of contents
{:toc}

## Layout issues

### Indentation should be multiples of 4 spaces

Indentation should be in multiples of 4 spaces.
Do not use tabs because they look different in different editors.

### Spaces around `:` in typed variable declarations.

Put a space either side of the 'has type' operator `:` as in `x : Bits(64)`.

### Spaces in expressions and statements

Put a space either side of a binary operator. For example `x + y` not `x+y`.

### Maximum line length is 120 characters (but 100 is preferred)

The maximum line length is normally 120 characters but reviewers might ask
the author to split lines over 100 characters or justify not splitting it.

A maximum line length of 100 characters is preferred because we are not yet
certain what line length we will want in the final specification and we may have
to reduce the maximum line length again in the future.

### Formatting function headers

If the function header fits within the maximum line length limit, the preferred format
is to put the entire function header on one line.
(The function header consists of the `function` keyword, the function name, the function arguments and the return type.)

If the function header is too long, it should be split as follows

```
function SomeFunctionName(
        arg1 : type1, arg2 : type2, arg3 : type3,
        arg4 : type4, arg5 : type5,
        arg6 : type6
    ) -> (return_type1, return_type2)
```

That is

- The function name and open parentheses are on the first line
- Indentation of the arguments is 8 characters.
- Indentation of the return type is 4 characters.
- Arguments can be grouped on a single line to emphasize connections between arguments.
- Putting one argument per line is not the preferred style and should be used only
  in exceptional circumstances.
- No space between function name and open parentheses.
- The close parentheses and "->" arrow are on the same line as the function return type.
- For functions with no return value, the final line would be just the closing parentheses
  indented 4 characters.

When grouping multiple arguments on a single line, you should prefer groupings
that put related arguments on the same line
and/or that are consistent with the way other functions have grouped arguments.
For example, almost all of the floating point helper functions have several arguments
that control rounding modes and handling of denormals so these functions
consistently put these arguments on the same line as each other.

It is tempting to put each argument on a separate line to allow for a comment on the same line.
It would be better to document the arguments in the function's `longdesc` documentation
and/or to improve the name of the function argument.


## Hex numbers

Note that hex numbers of length `n` have type `Bits(4*n)` but decimal numbers have type `Integer`
and that bitvectors cannot be directly compared using `<`, `<=`, `>=`, `>` or `in {_ .. _}`.
Some consequences of this are

- It is sometimes necessary to pad the number with zeros (e.g., `0x0000_0000` instead of `0x0`).

- It is sometimes necessary to use the standard library function `Unsigned()` to convert
  a hex number (bitvector) to an integer.

  For example,

  ```
      if Unsigned(EAX) in { 0 .. 15 } then ...
      if address in { Unsigned(0x800) .. Unsigned(0x8ff) }
  ```

## Naming conventions

### Names of functions are Camel_Case

Function names should be written in "Camel_Case" with underscores and should avoid abbreviation.
For example "Count_Leading_Zero_Bits", "Zero_Extend".

Extremely common acronyms may be used. For example, "Update_TLB".

### Namespaces are used to group related functions

A namespace such as "Memory::", "TSX::", "FRED::", etc. can be used to group
related functions (and variables).
Using a namespace makes it easier to find related code (e.g., in alphabetical
lists) and helps emphasize the relation between them.

It is often easiest to identify a potential namespace after writing a
number of functions that could be usefully grouped.

Although namespaces can be nested (e.g., we could name a function "Memory::Physical::Read"),
we have made little/no use of this capability so far.

### Consider using namespaces for enumeration constants

Consider writing

```
enumeration Color = { Color::Red, Color::Blue, Color::Green };
```

instead of

```
enumeration Color = { Color_Red, Color_Blue, Color_Green };
```

That is, consider using the name of the enumeration type
as a namespace.


### Names of registers follow the naming convention in the SDM

Most global variables correspond to registers in the architecture and should
use the existing name.

We should discuss any cases where this results in a name that is not
either `ALL_CAPS` or Camel_Case to see whether this style rule needs updated.

Global variables that are not based on names in the SDM should begin with an uppercase letter.

### Namespaces should be in Camel_Case

Where namespaces are used  such as `CET::Push`, each part of the name should be in Camel_Case
and should start with an upper-case letter.

### Names of local variables begin with a lowercase letter and are in snake_case.

Local variables should begin with a lowercase letter.
They may be written using "snake_case"
For example, "size", "unsigned_sum" or "src1_lsb".

### Names of record fields are written in "snake_case".

Fields of records are written in "snake_case". For example, "is_writable" and
"size".

We should consider exceptions where some external standard such as
IEEE Floating Point suggests names that don't adhere to our
normal rules (e.g., "ALL_CAPS" names).

Note that bitfields have a very different naming convention.

### Names of bitfields are written in "ALL_CAPS" or, exceptionally, "CamelCase".

Bitfields are almost exclusively used as fields of registers and it is
conventional to use "ALL_CAPS" for both the names of registers and for the
names of their fields. (I believe that 100% of the fields in the MSRs are
written in "ALL_CAPS".)

This convention works especially well when the names contain acronyms an abbreviations
(as is common in fields of older registers).

As the bitfields are parts of registers and memory layouts, the names are already
part of the architecture we should tend to follow the SDM.

Where the SDM uses a name that is not a legal identifier in C/Verilog/.isa (e.g., where
the name of a field contains a space), we have some freedom to change the name to make it
legal. In that case, we normally prefer "ALL_CAPS" but "Camel_Case" might also be acceptable.

Note that record fields have a very different naming convention.

### Bitfields are listed in order of ascending bit position

*[Note: This section is mostly irrelevant because
we very rarely use bitfields directly.
Instead, we create databases of the fields that include the name,
bitslice, a short description, a long description, etc.
This database is used to generate .isa code and documentation.]*

When defining a type with bitfields, list the fields in ascending order
according to the bit number. For example,

```
bitfield Flags = {
    CF    => [0]     // Carry
    PF    => [2]     // Parity
    AF    => [4]     // Auxiliary carry
    ZF    => [6]     // Zero
    SF    => [7]     // Sign
    ...
} : Bits(64);
```

This matches the convention used in the SDM.



## Expressions


### Bitslices: when to use each syntax option

Bitslices can be written in four ways.

- `x[23:16]` refers to the 3rd byte of  a bitvector `x`.
- `x[16 +: 8]` refers to the same 8 bits of x.
- `x[23 -: 8]` refers to the same 8 bits of x.
- `x[3 *: 8]` refers to the 3rd byte of x.

Although the four different syntaxes are equivalent, each one is better in
particular situations.

- The `x[lsb +: width]` syntax is usually preferred when we want to emphasize the width
  of the value or when the position or the width of the bitslice is defined by an expression or variable.

  For example, `x[32 +: width]` is simpler to read than the equivalent `x[31 + width : 32]`.

- The element slice syntax `x[element_index *: element_width]` is usually preferred when we want to
  emphasize that `x` is composed of a number of equal-sized elements.

  For example, in a vector instruction, we prefer `result[i *: element_size] := ...;` to
  `result[i * element_size +: element_size] := ...;`
  or to
  `result[(i * element_size) + element_size-1 : i * element_size)] := ...;`

- The `x[msb : lsb]` syntax is usually best when it matches some other documentation.
  For example, if manipulating values according to the IEEE 754 floating point specification,
  the IEEE 754 documentation might talk about bits 24 to 30 and so it is natural to write `x[30:24]`.

  In addition, the syntax is acceptable when both `msb` and `lsb` are literal constant numbers like `31` or `0`
  and when they are "familiar" numbers like "255", "63", "31", "7", "0", etc.
  In other words, when the reader is used to thinking about those particular
  bit-slices and can instinctively recognize that the width is 32 bits, 8 bits, or whatever.

  When either `msb` or `lsb` is not a literal constant number, it is usually better to use
  one of the other styles.

- The `x[high -: width]` syntax is rarely used. It may be useful in code that
  manipulates the top bits of a value. For example in code that creates or checks canonical addresses.

Outside of vector instructions, the `x[lsb +: width]` syntax is usually the preferred style.


## Statements

### Immutable variable declarations are preferred when possible

When a function only contains a single assignment to a local variable `v`, the assignment can be written in two ways.

- Explicitly declared with type inference: `let v := e;`.
  In this style, a new variable `v` is introduced and `v` is given the same type as `e`.

- Explicitly declared with explicit type: `let v : t := e;`.
  In this style, a new variable `v` is introduced and `v` is given the type `t`.

Writing a good specification requires us to find the right balance that is explicit to clarify but avoids unnecessary clutter.
The type can almost always be omitted but we will need to experiment to find the right balance.

Using immutable variable declarations instead of mutable variable declarations often leads to
clearer specifications so this is the preferred form of declaration.


### Mutable variable declarations are discouraged

When a function contains multiple assignments to a local variable `v`, the variable is mutable and can be declared in three ways.

- Explicitly declared with type inference: `var v := e;`.
  In this style, a new variable `v` is introduced and `v` is given the same type as `e`.

- Explicitly declared with no initializer: `var v : t;`.

- Explicitly declared with explicit type: `var v : t := e;`.
  In this style, a new variable `v` is introduced and `v` is given the type `t`.

In all three cases, later assignments to the variable use 'v := e;'

Local mutable variable declarations are mostly used:

- When a variable is modified each time round a loop. For example, when counting the
  number of occurences or finding the minimum value in an array.

- When a variable is modified in a conditional statement and the value is used after
  the conditional statement.



### For loops are preferred to while/repeat loops

In most cases `for` loops are preferred to while loops or repeat loops because it is easier to convert those loops to Verilog.

### Exceptions

The specification language provides support for throwing and catching exceptions.
This has previously been used to handle things like exceptions from memory read/write operations but their use is considered controversial because exceptions introduce "invisible" control flow that can make it hard to clearly understand specifications.
But, the alternative to using .isa's exception mechanisms is to add explicit control flow into the specification; this can add a lot of clutter if not done carefully.

We will need to experiment with different ways of specifying faulting behavior to find a style that hits the right balance between clarity and concision.


## Defining instructions

The rules for defining instructions are being developed at the moment so the following are just suggestions.

### Separate operand access from the operation

The Intel Architecture has several operand formats: those that access memory, those that access registers and those that access immediates.
We want to separate the part of the instruction that different variants of the same instruction have in common from those parts of the operand access that different instructions have in common.

#### Example/simplified operand read code

Operand read code for a memory operand and a register operand might look like this

```isa
let address := EffectiveAddress(a);
let src1 := Logical_Mem_Read(address, operand_size);
let src2 := R[r];
```


#### Example/simplified operand write code

Operand write code for a memory operand might look like this

```isa
Logical_Mem_Write(address, operand_size, result);
```

and, for a register operand, might look like this

```isa
R[r] := Merge_GPR(R[r], result);
```

Where the `Merge_GPR` function merges the result with the old value of the destination register.


#### Example instruction specification

An add instruction might look like this.

It calculates both the signed and unsigned result to calculate the values of CF and OF.

```isa
let signed_result   := Signed(src1) + Signed(src2);
let unsigned_result := Unsigned(src1) + Unsigned(src2);
let result          := signed_result[0 +: datasize]);
let carry           := Unsigned(result) != unsigned_result;
let overflow        := Signed(result) != signed_result;

flags.CF := if carry then 0b1 else 0b0;
flags.OF := if overflow then 0b1 else 0b0;
flags.PF := if Is_Parity_Even(result[7:0]) then 0b1 else 0b0;
flags.SF := result[datasize-1];
flags.ZF := if Is_Zero(result) then 0b1 else 0b0;
```

(Note that ADC, SUB, SBC, etc calculate CF and OF in a similar way so, in
practice, we use the functions [Function_Add] and [Function_Subtract] to
define the arithmetic operations.)


#### Example/simplified operand write code

Corresponding operand write code might look like this

```isa
Logical_Mem_Write(segment, address, operand_size, dest);
```

#### Combining the pieces

The full behaviour of an instruction consists of executing the operand read code, then the operation, then the operand write code.


## Incomplete code, todos, etc.

If the functionality of a function is not complete, mark this by inserting
a call to `Unimplemented_Feature("<function name>");` on the appropriate
branch of the code.

This will generate a runtime error if that part of the code is executed.
This will be much easier to diagnose than if the code does not flag an error
and just skips the necessary functionality.
It is also easier to search for when we want to find areas of the spec needing
work or if we are thinking of publishing part of the specification.

If it is not possible to use Unimplemented_Feature (e.g., because the missing
part is in a type definition or is in the explanatory text before a function)
then use 'todo: ' or `LTD: ` as a prefix to a description of the missing feature.

## Uninitialized variables and fields

It is an .isa language error to read a variable (or field or array element or bitslice) if it has not been
initialized.

This error is not currently being detected by [isa-tools].

It is not necessary to initialize a variable when it is declared.
For example, in the following code, it is preferred not to initialize `x` on
the first line unless there is an obvious default value to use.
Inserting a spurious initializer would be confusing and would prevent us from
catching uninitialized variables in the future (once we add that check to [isa-tools]).

```
var x : Bits(32);
if ... then
    x := Foo32(32);
else
    x[31:16] := Bar16();
    x[15:0] := Zeros();
end
```

## Architecture specific issues

### Unspecified and undocumented behavior

The Intel Architecture has a mixture of undocumented behavior and unspecified behavior.

It is important that we do not accidentally specify behavior that the architects
intend to be unspecified.
And it is important that we do not accidentally publish information that the architects
intend not to document.
We will need to be careful when writing the spec and when reviewing changes - especially
if we are consulting an internal source such as a simulator or RTL or fixing a mismatch
between the spec and a LIT test.

Unspecified and undocumented behavior is marked in several ways.

- Unspecified values (especially when they are being assigned to a flag / variable)
  are written like this

  ```
  RFLAGS.CF := UNSPECIFIED : Bit;
  ```

  This indicates that software should not rely on the value being assigned
  (even if it is consistently 0 (say) on some particular processor family).

  In the future, isa-tools will use a random value or a configuration-determined value
  for UNSPECIFIED bits.

- Where the behavior is predictable on each processor family (eg P-cores and E-cores)
  and the architects do not intend the value to be "unspecified",
  we should sometimes introduce feature functions or configuration variables
  so that the architecture spec can be configured to match the processors.

  ```
  if FeatureX() then
      FooBar();
  end
  ```

  or

  ```
  return Config_NumberOfYs;
  ```

  We will need to work on a consistent naming convention for these functions
  and variables.


### Exception checking

A lot of common patterns occur when adding exception checking code. Especially in instructions.

There are two basic approaches:

1) Use tables that list the exceptions to be checked for, the check and (implicitly)
   the priority of each check (earlier checks are higher priority).


   ```
   ### Exceptions

   | fault | condition        |
   | ----- | ---------------- |
   | #UD   | CPUID(BMI1)      |
   | #UD   | VEX_W_1          |
   | #UD   | VEX_L_1          |
   | #UD   | LockPrefix       |
   ```

   This table is used to generate the following code (in `gen/iforms.isa`)

   ```
   if !CPUID_BMI1 then Report_Invalid_Opcode()?; endif;
   if context.rex_w == 0b1 then Report_Invalid_Opcode()?; endif;
   if context.vex_L == 0b1 then Report_Invalid_Opcode()?; endif;
   if context.lock_prefix_present then Report__Invalid__Opcode()?; endif;
   ```

   The code patterns generated for each line of the table are currently
   hardcoded in `scripts/gen_decode.py` and we may also want to be able to
   generate English-language text for use in documentation.

2) Where this approach cannot be used, the style of the code is more
   important.

   We have not yet resolved the question of whether to allow single-line
   if-statements as in the generated code example or to follow the normal
   formatting rules and require the if-statement to be split over multiple lines.


### Recurring patterns should be written in a consistent way

Some checks are repeated many times across the architecture: CPL checks, etc.
The exact way that we write the checks is a bit arbitrary but we should be
consistent about how the checks are written.
This makes it easier to compare pieces of code, makes it easier to spot
refactoring opportunities, removes variation from one author to another.

There may sometimes be reasons to deviate from these rules but those should
usually be restricted to places where it affects the behavior of the code
and we should probably document the alternative style and when it is preferred
to the choices below.

#### CPL checks should normally use (in)equality checks (e.g., "CPL != 0b11")

Although the following are equivalent, the preferred form is the first one

```
CPL != 0b11
Unsigned(CPL) != 3
Unsigned(CPL) < 3
```

(Or `CPL == 0b11` when appropriate.)

There are also a few comparisions with zero which should be written `CPL == 0b00` or `CPL != 0b00`.

The exception to the normal rule that CPL comparisions are equality/inequality tests,
is when checking whether we are raising or lowering the privilege level in code like this:

```
Unsigned(new_cs.descriptor.DPL) < Unsigned(CPL))
```

### CR0.PG should be tested before CR4.PAE when in the same expression

*Note: the following rule is not consistently followed*

In an expression like the following that tests multiple flags, `CR0.PG` should be tested before `CR4.PAE`

```
assert CR0.PG == 0b1 and CR4.PAE == 0b1 and IA32_EFER.LME == 0b1;
```

### IA32_EFER.LME should be tested after `CR4.PAE` and `CR0.PG`

*Note: the following rule is not consistently followed*

In expressions like the following that tests multiple flags, `IA32_EFER.LME` should be tested after `CR4.PAE` and `CR0.PG`

```
assert CR0.PG == 0b1 and CR4.PAE == 0b1 and IA32_EFER.LME == 0b1;
if IA32_EFER.LME == 0b1 and CR4.PAE == 0b0 and CR0.PG == 0b0 and new_cr0.PG == 0b1 then
if IA32_EFER.LME == 0b1 and CR0.PG == 0b0 and new_cr0.PG == 0b1 and Is16BitTask(TR) then
if new_cr0.PG == 0b1 and IA32_EFER.LME == 0b1 and CR4.PAE == 0b1 then
```

### Instructions

Instructions have a lot of common patterns in them and we try to emphasize those similarities
by writing specs in a consistent way.

#### FLAG assignments are at the end of the instructions and follow the sequence OF, SF, ZF, AF, PF, CF where possible

That is, FLAGs are assigned in the reverse of the order that they appear in the RFLAGS register
(which is consistent with how many existing SDM instructions are written).
For example, it is common to see sequences like this

```
let (result, carry_out, overflow, alternative_carry) := Add(src1, src2);

RFLAGS.OF := overflow;
RFLAGS.SF := result[operand_size-1];
RFLAGS.ZF := if Is_Zero(result) then 0b1 else 0b0;
RFLAGS.AF := alternative_carry;
RFLAGS.PF := if Is_Parity_Even(result[0 +: 8]) then 0b1 else 0b0;
RFLAGS.CF := carry_out;
```

It is not always possible/appropriate to follow this pattern. For example, in the BLSI instruction,
the most natural place to calculate the CF flag is in the part that calculates the result so
CF is calculated first - but then the remaining flags are calculated in the standard order.


## Documentation

Each definition or instruction should contain a yaml section written as a
fenced code block like this

```yaml
shortdesc: Reset XMM registers
longdesc: >
    Reset all of the XMM registers to zero.
reference:
- SDM volume 3A, section 5.8.6:
- SDM volume 3A, section 6.14.4 Stack Switching in IA-32e Mode
```

The shortdesc entry should be added to all new definitions.

The longdesc entry is currently optional but recommended because we will need
them eventually and it will be easier to add the longdesc when you are thinking
about the function instead of in a few months time.

- The shortdesc entry

  The shortdesc entry should be a short description.
  Ideally no more than about 60 characters.
  (The longest shortdesc at the moment is 84 characters but it should probably be shortened.)

  The shortdesc cannot completely describe the function / instruction and you should not try.
  It's purpose is to let you know roughly what the function does, not to completely
  describe all the corner cases. That is, it gives you a bit more information than
  the function name but less than the longdesc.

  The simplest way to think about what to write in a shortdesc is to
  ask yourself whether a string of the form `${function-name} - ${shortdesc}`
  would make a good section title.

  The shortdesc entry follows a similar style to that found in the
  heading lines on instructions in the SDM. For example, the
  instruction "MOVAPD" has the following shortdesc in the SDM.
  "MOVAPD—Move Aligned Packed Double-Precision Floating-Point Values".

  The shortdesc is typically used in index lists of instructions / definitions in documentation
  alongside the name of the instruction definition.
  Since it is used alongside the name and to keep it short, the shortdesc
  usually leaves the subject of the description implicit.
  For example, instead of something like

      "This functions <does X>"

  the shortdesc is written like this

      "<Do X>"

  For example "Reset XMM" instead of "This function resets XMM".

  The shortdesc is not a sentence: it does not end in "." (and it does not have a subject).

  For more examples, see the webpage where shortdescs are shown on heading line
  to the right of the function name.

- The longdesc entry

  The longdesc entry is where we add the detail that cannot fit into the shortdesc.
  It is not constrained for space and consists of full sentences and paragraphs.

  The longdesc is a summary of the function that can talk about some of the corner
  cases or mode-dependent behavior of the function.

  The longdesc should normally be shorter than the function: it is a
  summary, not a replacement for reading the specification.

  Use [docbook] markup as needed in the longdesc.
  In particular, paragraphs should be marked with `<para>...</para>`.

  The longdesc entry can be several paragraphs long and is usually
  written like this in YAML

      longdesc: >
          <para>
          First paragraph of description.
          </para>

          <para>
          Another paragraph of description.
          </para>

- The reference section contains a list of references - usually to the SDM

  This should be a list of the sections that you referred to when writing
  this function. (If this is the same as the previous function, please copy and paste
  so that each function has its own references.)

  (For instructions that appear in the volume 2 of the SDM,
  there is no need to add a reference to the instruction page in the SDM.
  It may be useful to add a reference when the instruction is in volume 3,
  in the ISE/APX/AVX-10/FRED/... document.)

  The purposes of the references are

  - When we have to revisit the code (during review, bugfixing, adding a feature, etc.),
    it helps us understand why the code does what it does and it helps
    us understand whether the SDM contains a bug that we should report.

  - In documentation such as the website, it will allow us to create links
    from the website entry to the section/page of the SDM.

  - When we want to add helper functions to the SDM, it will help us find where in the SDM to
    insert the helper function.

  There is no rigid format yet (this should be added soon) but it often looks
  like this

      reference:
      - SDM volume 3A, section 5.8.6
      - SDM volume 3A, section 6.14.4 Stack Switching in IA-32e Mode

  The section title is optional but it is useful in case the section number
  changes in a future version of the SDM.


Put .isa code in a 'fenced code block' using the ```isa marker.

(This should come after the yaml section.)

Include any 'todo' actions that you need to take on the code.

Do not copy large chunks of text from the SDM.
It would be painful to compare the copied text against the original to
detect any changes that you have made.


[isa-tools]: https://github.com/IntelLabs/isa-tools/blob/master/README.md
[docbook]: https://docbook.org/
