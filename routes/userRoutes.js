// Express.js example route to suspend a user
app.patch('/api/users/:id/status', (req, res) => {
    const { id } = req.params;
    const { status } = req.body; // Expecting 'Active' or 'Suspended'
  
    // Assuming `User` is a Mongoose model or equivalent ORM model for users
    User.findByIdAndUpdate(id, { status }, { new: true })
      .then(updatedUser => {
        res.json(updatedUser);
        // Emit "forceLogout" event if the account is suspended
        if (status === 'Suspended') {
          io.to(updatedUser.socketId).emit('forceLogout', { message: 'Your account has been suspended.' });
        }
      })
      .catch(error => res.status(500).json({ error: 'Error updating user status' }));
  });